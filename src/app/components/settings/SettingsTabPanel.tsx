interface SettingsTabPanelProps {
	id: string;
	visible: boolean;
	children: React.ReactNode;
}

export default function SettingsTabPanel(props: SettingsTabPanelProps) {
	const { id, visible, children } = props;

	return (
		<div
			role="tabpanel"
			id={`settings-tabpanel-${id}`}
			data-cy={`settings-tabpanel-${id}`}
			aria-labelledby={`settings-tab-${id}`}
			hidden={!visible}
		>
			{children}
		</div>
	);
}
