import NewsFeed from '../components/NewsFeed';
import Sidebar from '../components/Sidebar';
import MobileSidebar from '../components/MobileSidebar';
import CompactHeroGrid from '../components/CompactHeroGrid';
import AvisoDesequilibrio from '../components/AvisoDesequilibrio';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* High Density Hero Spotlight Grid */}
            <CompactHeroGrid />

            {/* Antes del feed y a todo el ancho: explica cómo hay que leer
                todo lo que viene debajo, no una noticia concreta. */}
            <AvisoDesequilibrio />

            <MobileSidebar />
            
            <div className="home-content">
                <NewsFeed />
                <Sidebar />
            </div>
        </div>
    );
};

export default Home;
