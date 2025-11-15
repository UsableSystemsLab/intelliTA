export default function Sidebar (){
    return(
        <>
         <aside className=" opacity-95 w-64 h-screen bg-black/62 text-gray-300 p-4 flex flex-col">
          <nav className="flex flex-col gap-1 mt-4">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1E293B] text-white"
            >
              <span className="font-medium">Lab activities</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>Leaderboard</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>Calendar</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>Settings</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>Support</span>
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E293B] transition"
            >
              <span>Back</span>
            </a>
          </nav>
        </aside>
        </>
    )
}