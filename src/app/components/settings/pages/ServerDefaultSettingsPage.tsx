import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { SettingsSection } from '@app/components/settings/SettingsSection';
import { ZodIssue } from 'zod';
import { ValidatedInput } from '@app/components/ValidatedInput';
import { MdOutlineRestartAlt } from 'react-icons/md';
import { rebootServer } from '@app/api/system';
import { useQuery } from '@tanstack/react-query';
import { CgSpinner } from 'react-icons/cg';
import { IoMdWarning } from 'react-icons/io';
import { ServerConfig } from '@/types';

interface ServerDefaultSettingsPageProps {
	config: ServerConfig;
	validationErrors: Record<string, ZodIssue>;
	unsavedChanges: boolean;
	onChange: (config: ServerConfig) => void;
}

export function ServerDefaultSettingsPage(props: ServerDefaultSettingsPageProps) {
	const { config, validationErrors, unsavedChanges, onChange } = props;

	const [rebootClicked, setRebootClicked] = useState(false);

	const { isPending: isServerRebooting } = useQuery({
		queryKey: ['health'],
		queryFn: () => fetch(`${window.location.origin}/api/health`),
		enabled: rebootClicked
	});

	useEffect(() => {
		if (rebootClicked && !isServerRebooting) {
			window.location.reload();
		}
	}, [isServerRebooting, rebootClicked]);

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

	const onClickReboot = useCallback(async () => {
		setRebootClicked(true);
		await rebootServer();
	}, []);

	return (
		<div className="flex flex-col max-h-full">
			<SettingsSection title="Server Defaults" className="pt-5">
				<p className="text-sm text-slate-500">
					Default values can be overridden with server flags. For example the <code>--host</code>{' '}
					flag can be used to override the hostname.
				</p>
				<div className="space-y-3 mt-5">
					<h2 className="text-xs font-semibold text-slate-500 leading-none">Hostname</h2>
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
				<div className="space-y-3 mt-8">
					<h2 className="text-xs font-semibold text-slate-500 leading-none">Port</h2>
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
				<div className="space-y-3 mt-8">
					<h2 className="text-xs font-semibold text-slate-500 leading-none">Memory size</h2>
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
			<SettingsSection title="Restart server" className="space-y-5 pt-5">
				<p className="text-sm text-slate-500">
					Restart the server and reload the page. You will need to manually navigate to the correct
					URL if the server's connection details have changed.
				</p>
				<div className="flex items-center">
					<button
						className="h-[30px] font-medium bg-gray-50 border hover:bg-gray-50/50 active:bg-white text-left pl-3 pr-4 rounded inline-flex items-center disabled:opacity-60"
						onClick={onClickReboot}
						disabled={rebootClicked}
					>
						{rebootClicked && <CgSpinner className="animate-spin text-lg text-slate-500" />}
						{!rebootClicked && <MdOutlineRestartAlt className="text-lg text-slate-500" />}
						<span className="ml-2 text-sm text-slate-500">{'Restart'}</span>
					</button>
					{unsavedChanges && (
						<div className="ml-8 flex items-center justify-end">
							<IoMdWarning className="text-yellow-500 text-xl" />
							<span className="ml-2 text-sm text-yellow-700">You have unsaved changes</span>
						</div>
					)}
				</div>
			</SettingsSection>
		</div>
	);
}
