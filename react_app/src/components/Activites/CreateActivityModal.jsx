import { useState } from "react";
import { Loader, X, Upload, Link as LinkIcon, FileText } from "lucide-react";

export default function CreateActivityModal({ isOpen, onClose, courseId, onActivityCreated }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [videoOption, setVideoOption] = useState("file");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mdFile, setMdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("start_date", new Date(startDate).toISOString());
    formData.append("end_date", new Date(endDate).toISOString());
    
    if (videoOption === "file" && videoFile) {
        formData.append("video", videoFile);
    } else if (videoOption === "url" && videoUrl) {
        formData.append("video_url", videoUrl);
    }

    if (mdFile) {
        formData.append("md_file", mdFile);
    }

    try {
        const response = await fetch(`http://localhost:4000/api/courses/${courseId}/activities`, {
            method: "POST",
            headers: {
                 "Authorization": "Bearer 1111",
            },
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json();
            console.error("Create Activity Error Details:", data);
            throw new Error(data.error || data.message || "Failed to create activity");
        }

        const newActivity = await response.json();
        onActivityCreated(newActivity);
        onClose();
        // Reset form
        setTitle("");
        setStartDate("");
        setEndDate("");
        setVideoFile(null);
        setVideoUrl("");
        setMdFile(null);
    } catch (err) {
        setErrorMsg(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-lg w-full shadow-2xl relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Create New Activity</h2>
        
        {errorMsg && (
             <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-sm">
                 {errorMsg}
             </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Activity Name</label>
                <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                     <input 
                        type="datetime-local" 
                        required 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                     />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                     <input 
                        type="datetime-local" 
                        required 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                     />
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Video Source (Optional)</label>
                 <div className="flex gap-4 mb-2">
                     <button 
                        type="button" 
                        className={`flex-1 py-2 rounded border ${videoOption === 'file' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 hover:bg-slate-700'}`}
                        onClick={() => setVideoOption("file")}
                     >
                        Upload Video
                     </button>
                     <button 
                        type="button" 
                        className={`flex-1 py-2 rounded border ${videoOption === 'url' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-600 hover:bg-slate-700'}`}
                        onClick={() => setVideoOption("url")}
                     >
                        Video URL
                     </button>
                 </div>

                 {videoOption === 'file' ? (
                     <div className="border border-dashed border-slate-600 rounded p-4 text-center hover:bg-slate-700/50 transition">
                         <input 
                            type="file" 
                            accept="video/*" 
                            id="video-upload" 
                            className="hidden" 
                            onChange={(e) => setVideoFile(e.target.files[0])}
                         />
                         <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                             <Upload className="w-8 h-8 text-gray-400 mb-2" />
                             <span className="text-sm text-gray-400">{videoFile ? videoFile.name : "Click to upload video"}</span>
                         </label>
                     </div>
                 ) : (
                     <div className="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded p-2">
                         <LinkIcon className="text-gray-400 w-5 h-5" />
                         <input 
                             type="url" 
                             className="bg-transparent w-full focus:outline-none text-white" 
                             placeholder="https://example.com/video.mp4"
                             value={videoUrl}
                             onChange={(e) => setVideoUrl(e.target.value)}
                         />
                     </div>
                 )}
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Markdown File (Optional)</label>
                 <div className="border border-dashed border-slate-600 rounded p-4 text-center hover:bg-slate-700/50 transition">
                     <input 
                        type="file" 
                        accept=".md, .markdown" 
                        id="md-upload" 
                        className="hidden" 
                        onChange={(e) => setMdFile(e.target.files[0])}
                     />
                     <label htmlFor="md-upload" className="cursor-pointer flex flex-col items-center">
                         <FileText className="w-8 h-8 text-gray-400 mb-2" />
                         <span className="text-sm text-gray-400">{mdFile ? mdFile.name : "Click to upload .md file"}</span>
                     </label>
                 </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
            >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : "Create Activity"}
            </button>
        </form>
      </div>
    </div>
  );
}
