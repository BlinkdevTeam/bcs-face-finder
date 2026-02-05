const Folders = ({results}) => {

    return (
        <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder w-6 h-6 text-indigo-400"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>
                    <h2 className="text-xl font-semibold text-white">Folders</h2>
                </div>
                <div className="space-y-4">
                    <div className="border border-gray-600 rounded-lg overflow-hidden hover:shadow-lg hover:border-indigo-500 transition-all">
                        <div className="bg-gray-700 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image w-5 h-5 text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                        <h3 className="font-semibold text-white">Batch 2024 &gt; Engineering &gt; Computer Science &gt; Individual Photos</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 font-mono">/graduation/2024/engineering/cs/individual</p>
                                </div>
                                <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold ml-4">6 photos</span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-750">
                            <div className="flex gap-2">
                                {/* <div className="w-20 h-20 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image w-8 h-8 text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                </div>
                                <div className="w-20 h-20 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image w-8 h-8 text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                </div>
                                <div className="w-20 h-20 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image w-8 h-8 text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                </div>
                                <div className="w-20 h-20 bg-gray-700 rounded border border-gray-500 flex items-center justify-center">
                                    <span className="text-gray-300 text-sm font-medium">+3</span>
                                </div> */}
                                {results.map(item => (
                                    <div>
                                        <div
                                            key={item.file_id}
                                            className="w-32 h-32 bg-gray-600 rounded border border-gray-500 overflow-hidden flex flex-col"
                                        >
                                            <img
                                                src={`http://127.0.0.1:8000/image/${item.file_id}`}
                                                className="w-full h-full object-cover"
                                                alt={item.file_name}
                                            />
                                        </div>
                                        <p className="text-white">{item.file_name.length > 10 ? item.file_name.slice(0, 10) + " . . ." : item.file_name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Folders