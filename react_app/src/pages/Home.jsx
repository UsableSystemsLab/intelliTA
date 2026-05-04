import HomeMain from '@/components/Landing-page/HomeMain';
import HomeFooter from '@/components/shared/Footer';
import Nav from '@/components/Landing-page/Nav';
export default function Home({ user }) {

    return(  
        <>
        <Nav user={ user } />
        <HomeMain user={user} />
        <HomeFooter />
        </>
    );
} 
