import { ChangeEventHandler, useCallback } from 'react';
import SettingsSection from './SettingsSection';
import { ZodIssue } from 'zod';
import ValidatedInput from '../ValidatedInput';

interface ConfigServerSettingsProps {
	config: ServerConfig;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: ServerConfig) => void;
}

export default function ConfigServerSettings(props: ConfigServerSettingsProps) {
	const { config, validationErrors, onChange } = props;

	const onChangeHostname: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			onChange({
				...config,
				defaults: { ...config.defaults, hostname: evt.target.value.replace(/ /g, '') }
			});
		},
		[config, onChange]
	);

	const onChangePort: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			onChange({
				...config,
				defaults: { ...config.defaults, port: evt.target.value as any }
			});
		},
		[config, onChange]
	);

	const onChangeMemorySize: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			onChange({
				...config,
				defaults: { ...config.defaults, memorySize: evt.target.value as any }
			});
		},
		[config, onChange]
	);

	return (
		<div className="flex flex-col max-h-full">
			<SettingsSection title="Defaults" className="space-y-8 pt-5">
				<p className="text-sm text-slate-500">
					Default values can be overridden with server flags. For example the <code>--host</code>{' '}
					flag can be used to override the hostname.
				</p>
				<div className="space-y-3">
					<h2 className="text-xs font-semibold text-slate-500">Hostname</h2>
					<p className="text-sm text-slate-500 leading-none">
						The hostname or IP address the server should listen on.
					</p>
					<ValidatedInput
						error={validationErrors['defaults.hostname']?.message}
						value={config.defaults.hostname}
						onChange={onChangeHostname}
						id="server-defaults-hostname-input"
						data-cy="server-defaults-hostname-input"
					/>
				</div>
				<div className="space-y-3">
					<h2 className="text-xs font-semibold text-slate-500">Port</h2>
					<p className="text-sm text-slate-500 leading-none">
						The port the server should listen on.
					</p>
					<ValidatedInput
						error={validationErrors['defaults.port']?.message}
						value={String(config.defaults.port)}
						onChange={onChangePort}
						id="server-defaults-port-input"
						data-cy="server-defaults-port-input"
					/>
				</div>
				<div className="space-y-3">
					<h2 className="text-xs font-semibold text-slate-500">Memory size</h2>
					<p className="text-sm text-slate-500 leading-none">
						Number of logs the server should keep in memory.
					</p>
					<ValidatedInput
						error={validationErrors['defaults.memorySize']?.message}
						value={String(config.defaults.memorySize)}
						onChange={onChangeMemorySize}
						id="server-defaults-memorySize-input"
						data-cy="server-defaults-memorySize-input"
					/>
				</div>
			</SettingsSection>
		</div>
	);
}
