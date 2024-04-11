interface SettingsTabPanelProps {
	id: string;
	visible: boolean;
	disabled: boolean;
	children: React.ReactNode;
}

export function SettingsTabPanel(props: SettingsTabPanelProps) {
	const { id, visible, disabled, children } = props;

	return (
		<div
			role="tabpanel"
			id={`settings-tabpanel-${id}`}
			data-cy={`settings-tabpanel-${id}`}
			aria-labelledby={`settings-tab-${id}`}
			hidden={!visible}
			style={{
				opacity: disabled ? 0.6 : 1,
				pointerEvents: disabled ? 'none' : 'auto'
			}}
		>
			{children}
		</div>
	);
}
