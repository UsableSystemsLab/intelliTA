import HomeMain from '@/components/Landing-page/HomeMain';
import HomeFooter from '@/components/Landing-page/HomeFooter';
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
