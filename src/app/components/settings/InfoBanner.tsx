import { IoMdWarning } from 'react-icons/io';
import { MdErrorOutline, MdInfoOutline } from 'react-icons/md';

const variantIcons = {
	info: MdInfoOutline,
	note: MdInfoOutline,
	warning: IoMdWarning,
	error: MdErrorOutline
};

interface InfoBannerProps {
	variant?: 'info' | 'note' | 'warning' | 'error';
	children: React.ReactNode;
}

export default function InfoBanner(
	props: InfoBannerProps & Omit<React.HTMLProps<HTMLDivElement>, keyof InfoBannerProps>
) {
	const { variant, children, ...rest } = props;

	const Icon = variantIcons[variant ?? 'info'];

	return (
		<div {...rest}>
			<div
				data-variant={variant ?? 'info'}
				className="group flex py-2 px-3 space-x-2 data-[variant=info]:bg-sky-100 data-[variant=note]:bg-slate-50 data-[variant=warning]:bg-amber-100 data-[variant=error]:bg-red-100 border data-[variant=info]:border-sky-300 data-[variant=warning]:border-yellow-300 data-[variant=error]:border-red-300 rounded"
			>
				<div className="grow-0 shrink-0">
					<Icon className="text-xl group-data-[variant=info]:text-sky-400 group-data-[variant=note]:text-slate-400 group-data-[variant=warning]:text-yellow-700 group-data-[variant=error]:text-red-400" />
				</div>
				<p className="text-sm group-data-[variant=info]:text-slate-500 group-data-[variant=note]:text-slate-500 group-data-[variant=warning]:text-slate-500 group-data-[variant=warning]:text-yellow-800 group-data-[variant=error]:text-red-500">
					{children}
				</p>
			</div>
		</div>
	);
}
