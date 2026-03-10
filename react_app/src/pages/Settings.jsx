import Nav from '@/components/Courses/Nav';
import SettingsLayout from '@/components/Settings/SettingsLayout';
import Footer from '@/components/Courses/Footer';

import Sidebar from '@/components/Courses/Sidebar';

export default function Settings({ user, setUser }) {
    return(
        <>
            <Nav user={ user } />
            <div className='flex relative min-h-screen bg-gray-900'>
                <Sidebar />
                <div className="flex-1 w-full">
                    <SettingsLayout user={user} setUser={setUser} />
                </div>
            </div>
            <Footer />
        </>
    );
}
