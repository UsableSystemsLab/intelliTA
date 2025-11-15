import Nav from '@/components/Courses/Nav';
import Maincontent from '@/components/Courses/Maincontent';
import Footer from '@/components/Courses/Footer';
export default function Courses({ user }) {
    return(  
        <>
            <Nav user={ user } />
            <Maincontent /> 
            <Footer />
        </>
    );
}
