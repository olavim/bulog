export function SessionExpiredDialog() {
	return (
		<div className="absolute left-0 top-0 w-full h-full bg-black/25 z-50 flex items-center justify-center">
			<div className="flex flex-col bg-white overflow-hidden rounded-lg py-16 w-[40rem] items-center space-y-8">
				<div className="flex flex-col w-full items-center justify-center space-y-6">
					<span>
						<img
							src="/assets/browser-refresh.svg"
							alt="Session expired"
							className="w-32 relative left-[7px]"
						/>
					</span>
					<h1 className="text-2xl font-bold text-slate-500 leading-none text-center">
						Your session has expired
					</h1>
					<p className="text-lg text-slate-400 font-medium text-center max-w-[24rem]">
						You have been signed out. To continue using Bulog, please sign back in.
					</p>
				</div>
				<div className="flex w-full justify-center">
					<a
						href="/login"
						className="px-8 py-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-medium text-center"
					>
						{'Sign in'}
					</a>
				</div>
			</div>
		</div>
	);
}
