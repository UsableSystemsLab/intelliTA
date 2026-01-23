import { Loader } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">
            <Loader className="w-10 h-10 animate-spin text-blue-500" />
        </div>
    );
}
