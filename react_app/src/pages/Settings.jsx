import Nav from '@/components/Courses/Nav';
import SettingsLayout from '@/components/Settings/SettingsLayout';
import Footer from '@/components/Courses/Footer';

import Sidebar from '@/components/Courses/Sidebar';

export default function Settings({ user }) {
    return(  
        <>
            <Nav user={ user } />
            <div className='flex relative min-h-screen bg-gray-900'>
                <Sidebar />
                <div className="flex-1 w-full">
                    <SettingsLayout user={user} />
                </div>
            </div>
            <Footer />
        </>
    );
}
