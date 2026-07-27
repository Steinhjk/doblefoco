/**
 * PROYECCIÓN DEL CATÁLOGO DE MEDIOS SOBRE LA TABLA `sources` — tarea F2-01.
 *
 * La palabra es PROYECCIÓN, no copia. shared/mediaRegistry.js sigue siendo la
 * única fuente de verdad del sesgo: eso fue la tarea F1-04, y costó descubrir
 * cuatro documentos que se contradecían entre sí, con el más severo justo en el
 * que leía el público. Esta tabla existe por una razón mecánica —que
 * `articles.source_id` tenga a qué apuntar— y se regenera desde el registro.
 *
 * Si alguien edita el sesgo aquí con un UPDATE, el siguiente arranque lo
 * revierte. Esa es la intención, no un efecto secundario.
 *
 * Se ejecuta en dos momentos: en `npm run db:migrate` y al arrancar el
 * servidor. Lo segundo no es redundante: si se añade un medio al registro y se
 * despliega sin migrar, la primera ingesta insertaría artículos con un
 * `source_id` inexistente y la clave foránea rechazaría el lote entero.
 */

import { MEDIA_REGISTRY } from '../../shared/mediaRegistry.js';
import { query, withTransaction } from './pool.js';

/**
 * Vuelca el registro sobre `sources`.
 *
 * @returns {Promise<{inserted:number, updated:number, orphans:Array<{id:string,name:string}>}>}
 */
export async function syncSources() {
    let inserted = 0;
    let updated = 0;

    await withTransaction(async (client) => {
        for (const medium of MEDIA_REGISTRY) {
            // `xmax = 0` distingue una fila recién insertada de una actualizada.
            // Es la forma estándar de saberlo en un UPSERT de Postgres.
            const { rows } = await client.query(
                `
                INSERT INTO sources
                    (id, name, domain, country, media_group, bias, factuality,
                     bias_rationale, reviewed_at, synced_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
                ON CONFLICT (id) DO UPDATE SET
                    name           = EXCLUDED.name,
                    domain         = EXCLUDED.domain,
                    country        = EXCLUDED.country,
                    media_group    = EXCLUDED.media_group,
                    bias           = EXCLUDED.bias,
                    factuality     = EXCLUDED.factuality,
                    bias_rationale = EXCLUDED.bias_rationale,
                    reviewed_at    = EXCLUDED.reviewed_at,
                    synced_at      = now()
                RETURNING (xmax = 0) AS was_inserted
                `,
                [
                    medium.id,
                    medium.name,
                    medium.domain,
                    medium.country,
                    medium.group ?? null,
                    medium.bias,
                    medium.factuality,
                    medium.biasRationale,
                    medium.reviewedAt ?? null,
                ]
            );

            if (rows[0].was_inserted) inserted += 1;
            else updated += 1;
        }
    });

    /**
     * Un medio retirado del registro NO se borra.
     *
     * Sus artículos ya ingeridos apuntan aquí, y borrar la fila rompería la
     * clave foránea o —peor— obligaría a borrar los artículos en cascada. Se
     * perdería el rastro de qué mostró el sitio y con qué clasificación, que es
     * justamente lo que este proyecto promete poder auditar. Se informa y se
     * decide a mano.
     */
    const { rows: orphans } = await query(
        `SELECT id, name FROM sources WHERE id <> ALL($1::text[]) ORDER BY name`,
        [MEDIA_REGISTRY.map((m) => m.id)]
    );

    return { inserted, updated, orphans };
}
