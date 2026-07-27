import NewsFeed from '../components/NewsFeed';
import Sidebar from '../components/Sidebar';
import MobileSidebar from '../components/MobileSidebar';
import CompactHeroGrid from '../components/CompactHeroGrid';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* High Density Hero Spotlight Grid */}
            <CompactHeroGrid />

            <MobileSidebar />
            
            <div className="home-content">
                <NewsFeed />
                <Sidebar />
            </div>
        </div>
    );
};

export default Home;
