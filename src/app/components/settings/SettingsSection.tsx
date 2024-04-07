interface SettingsSectionProps {
	title: string;
	children: React.ReactNode;
}

export default function SettingsSection(props: SettingsSectionProps) {
	const { title, children } = props;

	return (
		<div className="flex flex-col mb-6">
			<div className="h-[30px] flex items-center pb-2 py-1 border-b border-slate-200">
				<h1 className="font-semibold text-xs text-slate-500 uppercase relative">{title}</h1>
			</div>
			<div className="flex flex-col py-4">{children}</div>
		</div>
	);
}
