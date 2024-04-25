import { ChangeEventHandler, useCallback } from 'react';
import { SettingsSection } from '@app/components/settings/SettingsSection';
import { ZodIssue } from 'zod';
import { ServerConfig } from '@/types';
import { FileInput } from '@app/components/FileInput';
import { InfoBanner } from '../InfoBanner';

interface HTTPSSettingsPageProps {
	config: ServerConfig;
	uploadData: Record<string, File>;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: ServerConfig) => void;
	onChangeUploadData: (uploadData: Record<string, File>) => void;
}

export function HTTPSSettingsPage(props: HTTPSSettingsPageProps) {
	const { config, uploadData, validationErrors, onChange, onChangeUploadData } = props;

	const onChangeEnableHTTPS: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			onChange({
				...config,
				https: { ...config.https, enabled: evt.target.checked } as any
			});
		},
		[config, onChange]
	);

	const onChangeHTTPSKey = useCallback(
		(file: File | null) => {
			if (file) {
				onChangeUploadData({
					...uploadData,
					['https-key']: file
				});
			} else {
				onChangeUploadData(
					Object.fromEntries(Object.entries(uploadData).filter(([key]) => key !== 'https-key'))
				);
			}
			onChange({
				...config,
				https: { ...config.https, key: Boolean(file) } as any
			});
		},
		[config, onChange, onChangeUploadData, uploadData]
	);

	const onChangeHTTPSCert = useCallback(
		(file: File | null) => {
			if (file) {
				onChangeUploadData({
					...uploadData,
					['https-cert']: file
				});
			} else {
				onChangeUploadData(
					Object.fromEntries(Object.entries(uploadData).filter(([key]) => key !== 'https-cert'))
				);
			}
			onChange({
				...config,
				https: { ...config.https, cert: Boolean(file) } as any
			});
		},
		[config, onChange, onChangeUploadData, uploadData]
	);

	return (
		<div className="flex flex-col max-h-full">
			<SettingsSection title="Enable HTTPS" className="pt-5 space-y-4">
				<p className="text-sm text-slate-500">
					Enable HTTPS for encrypted and trusted communication between the server and clients.
					Enabling HTTPS will disable HTTP connections.
				</p>
				<div className="flex">
					<input
						id="settings-https-enabled"
						data-cy="https-enabled-checkbox"
						type="checkbox"
						className="peer accent-sky-600 focus:outline-none focus-visible:ring"
						checked={config.https.enabled}
						name="Enable HTTPS"
						onChange={onChangeEnableHTTPS}
					/>
					<label
						htmlFor="settings-https-enabled"
						className="ml-4 text-sm font-normal text-slate-500 peer-disabled:opacity-50"
					>
						{'Enable HTTPS'}
					</label>
				</div>
			</SettingsSection>
			<SettingsSection title="HTTPS Settings" className="pt-5">
				<div className="space-y-3">
					<h2 className="text-xs font-semibold text-slate-500 leading-none">Certificate file</h2>
					<p className="text-sm text-slate-500">Select your certificate file in PEM format.</p>
					<FileInput
						onChange={onChangeHTTPSCert}
						file={uploadData['https-cert']}
						existingFileName={config.https.cert ? 'bulog.crt' : undefined}
						accept=".crt,.cer,.cert,.pem"
						className="w-full"
						inputProps={{ 'data-cy': 'https-cert-file-input' } as any}
					/>
					{validationErrors['https.cert'] && (
						<InfoBanner variant="error">{validationErrors['https.cert']?.message}</InfoBanner>
					)}
				</div>
				<div className="space-y-3 mt-8">
					<h2 className="text-xs font-semibold text-slate-500 leading-none">Private key file</h2>
					<p className="text-sm text-slate-500">Select your private key file in PEM format.</p>
					<FileInput
						onChange={onChangeHTTPSKey}
						file={uploadData['https-key']}
						existingFileName={config.https.key ? 'bulog.key' : undefined}
						accept=".key,.pem"
						className="w-full"
						inputProps={{ 'data-cy': 'https-key-file-input' } as any}
					/>
					{validationErrors['https.key'] && (
						<InfoBanner variant="error">{validationErrors['https.key']?.message}</InfoBanner>
					)}
				</div>
			</SettingsSection>
		</div>
	);
}
