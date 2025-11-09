import HomeMain from '@/components/HomeMain';
import HomeFooter from '@/components/HomeFooter';
import Nav from '@/components/Nav';
export default function Home({ user }) {

    return(  
        <>
         <Nav user={ user } />
        <HomeMain />
        <HomeFooter />
        </>
    );
} 
