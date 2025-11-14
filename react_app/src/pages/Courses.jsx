// pages/Courses.jsx
import Nav from '@/components/Landing-page/Nav';

export default function Courses({ user }) {
    return(  
        <>
            <Nav user={ user } />

            <div className="text-white p-10 text-3xl">
                Courses Page
            </div>
        </>
    );
}
