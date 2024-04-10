interface SettingsSectionProps {
	title: string;
	children: React.ReactNode;
}

export function SettingsSection(props: SettingsSectionProps & React.HTMLProps<HTMLDivElement>) {
	const { title, children, ...rest } = props;

	return (
		<section className="flex flex-col mb-8 last:mb-0">
			<div className="h-[30px] flex items-center pb-2 py-1 border-b border-slate-200">
				<h1 className="font-semibold text-xs text-slate-500 relative uppercase">{title}</h1>
			</div>
			<div {...rest}>{children}</div>
		</section>
	);
}
