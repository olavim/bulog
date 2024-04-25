import { ChangeEventHandler, useCallback } from 'react';
import { SettingsSection } from '@app/components/settings/SettingsSection';
import { ZodIssue } from 'zod';
import { ValidatedInput } from '@app/components/ValidatedInput';
import { InfoBanner } from '../InfoBanner';
import { ServerConfig } from '@/types';
import { MdAddCircleOutline } from 'react-icons/md';
import { RiDeleteBinLine } from 'react-icons/ri';
import { produce } from 'immer';

interface AuthSettingsPageProps {
	config: ServerConfig;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: ServerConfig) => void;
}

export function AuthSettingsPage(props: AuthSettingsPageProps) {
	const { config, validationErrors, onChange } = props;

	const onChangeAuthMethod: ChangeEventHandler<HTMLSelectElement> = useCallback(
		(evt) => {
			const method = evt.target.value as 'none' | 'oidc';
			onChange(
				produce(config, (draft) => {
					draft.auth.method = method;
					if (method === 'oidc' && !draft.auth.oidc) {
						draft.auth.oidc = {
							baseUrl: '',
							issuerUrl: '',
							clientId: '',
							clientSecret: '',
							authorizationParams: [],
							webClientClaims: [],
							logClientClaims: []
						};
					}
				})
			);
		},
		[config, onChange]
	);

	const onChangeOidcBaseURL: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.baseUrl = evt.target.value;
				})
			),
		[config, onChange]
	);

	const onChangeOidcIssuer: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.issuerUrl = evt.target.value;
				})
			),
		[config, onChange]
	);

	const onChangeOidcClientId: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.clientId = evt.target.value;
				})
			),
		[config, onChange]
	);

	const onChangeOidcClientSecret: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.clientSecret = evt.target.value;
				})
			),
		[config, onChange]
	);

	const onAddAuthorizationParam = useCallback(
		() =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.authorizationParams.push({ key: '', value: '' });
				})
			),
		[config, onChange]
	);

	const onDeleteAuthorizationParam = useCallback(
		(idx: number) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.authorizationParams.splice(idx, 1);
				})
			),
		[config, onChange]
	);

	const onChangeAuthorizationParamKey = useCallback(
		(idx: number, key: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.authorizationParams[idx].key = key;
				})
			),
		[config, onChange]
	);

	const onChangeAuthorizationParamValue = useCallback(
		(idx: number, value: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.authorizationParams[idx].value = value;
				})
			),
		[config, onChange]
	);

	const onChangeWebClientClaimsKey = useCallback(
		(idx: number, key: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.webClientClaims[idx].key = key;
				})
			),
		[config, onChange]
	);

	const onChangeWebClientClaimsValue = useCallback(
		(idx: number, value: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.webClientClaims[idx].value = value;
				})
			),
		[config, onChange]
	);

	const onDeleteWebClientClaim = useCallback(
		(idx: number) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.webClientClaims.splice(idx, 1);
				})
			),
		[config, onChange]
	);

	const onAddWebClientClaim = useCallback(
		() =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.webClientClaims.push({ key: '', value: '' });
				})
			),
		[config, onChange]
	);

	const onChangeLogClientClaimsKey = useCallback(
		(idx: number, key: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.logClientClaims[idx].key = key;
				})
			),
		[config, onChange]
	);

	const onChangeLogClientClaimsValue = useCallback(
		(idx: number, value: string) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.logClientClaims[idx].value = value;
				})
			),
		[config, onChange]
	);

	const onDeleteLogClientClaim = useCallback(
		(idx: number) =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.logClientClaims.splice(idx, 1);
				})
			),
		[config, onChange]
	);

	const onAddLogClientClaim = useCallback(
		() =>
			onChange(
				produce(config, (draft) => {
					draft.auth.oidc!.logClientClaims.push({ key: '', value: '' });
				})
			),
		[config, onChange]
	);

	return (
		<div className="flex flex-col max-h-full">
			<SettingsSection title="Authentication method" className="pt-5">
				<div className="space-y-5">
					<p className="text-sm text-slate-500">
						Choose an authentication method for accessing the server. Selecting <i>None</i> will
						disable authentication and the server becomes publicly accessible.
					</p>
					<InfoBanner variant="note">
						You can disable authentication temporarily by starting the server with the{' '}
						<code>--no-auth</code> flag. Keep this in mind if you lock yourself out due to
						misconfiguration.
					</InfoBanner>
					<select
						className="text-sm py-1 px-2 bg-white border rounded text-slate-600"
						onChange={onChangeAuthMethod}
						value={config.auth.method}
					>
						<option value="none">None</option>
						{window.staticConfig.authAllowed && (
							<>
								<option value="oidc">OpenID Connect</option>
							</>
						)}
					</select>
				</div>
			</SettingsSection>
			{config.auth.method === 'oidc' && (
				<>
					<SettingsSection title="OpenID Connect" className="pt-5">
						<p className="text-sm text-slate-500">
							Use an external OpenID Connect provider for authentication.
						</p>
						<div className="space-y-3 mt-5">
							<h2 className="text-xs font-semibold text-slate-500 leading-none">Base URL</h2>
							<p className="text-sm text-slate-500">
								The base URL of your website, such as <code>https://example.com</code>.
							</p>
							<ValidatedInput
								onChange={onChangeOidcBaseURL}
								value={config.auth.oidc.baseUrl}
								error={validationErrors['auth.baseUrl']?.message}
							/>
						</div>
						<div className="space-y-3 mt-8">
							<h2 className="text-xs font-semibold text-slate-500 leading-none">Issuer base URL</h2>
							<p className="text-sm text-slate-500">
								The base URL of your OpenID Connect issuer. For example, the{' '}
								<code className="whitespace-nowrap">/.well-known</code> endpoints should exist
								relative to the issuer base URL.
							</p>
							<ValidatedInput
								onChange={onChangeOidcIssuer}
								value={config.auth.oidc.issuerUrl}
								error={validationErrors['auth.issuerUrl']?.message}
							/>
						</div>
						<div className="space-y-3 mt-8">
							<h2 className="text-xs font-semibold text-slate-500 leading-none">Client ID</h2>
							<ValidatedInput
								onChange={onChangeOidcClientId}
								value={config.auth.oidc.clientId}
								error={validationErrors['auth.clientId']?.message}
							/>
						</div>
						<div className="space-y-3 mt-8">
							<h2 className="text-xs font-semibold text-slate-500 leading-none">Client secret</h2>
							<ValidatedInput
								onChange={onChangeOidcClientSecret}
								value={config.auth.oidc.clientSecret}
								error={validationErrors['auth.clientSecret']?.message}
							/>
						</div>
						<div className="space-y-3 mt-8">
							<h2 className="text-xs font-semibold text-slate-500 leading-none">
								Authorization parameters
							</h2>
							<p className="text-sm text-slate-500">
								Additional URL parameters used when redirecting users to the authorization server to
								sign in. Parameters such as <code>scope</code> and <code>audience</code> are
								typically set here.
							</p>
							{config.auth.oidc.authorizationParams.map((param, idx) => (
								<div key={idx} className="flex items-center space-x-2">
									<ValidatedInput
										className="basis-[8rem]"
										onChange={(evt) => onChangeAuthorizationParamKey(idx, evt.target.value)}
										value={param.key}
										placeholder="Key"
										error={validationErrors[`auth.authorizationParams.${idx}.key`]?.message}
									/>
									<ValidatedInput
										className="grow"
										onChange={(evt) => onChangeAuthorizationParamValue(idx, evt.target.value)}
										value={param.value}
										placeholder="Value"
										error={validationErrors[`auth.authorizationParams.${idx}.value`]?.message}
									/>
									<button
										className="hover:bg-slate-100 rounded-full w-[2rem] h-[2rem] flex justify-center items-center"
										onClick={() => onDeleteAuthorizationParam(idx)}
									>
										<RiDeleteBinLine className="text-red-500 text-lg" />
									</button>
								</div>
							))}
							<button
								className="py-1 text-sm text-sky-600 hover:text-sky-500 flex items-center"
								onClick={onAddAuthorizationParam}
							>
								<MdAddCircleOutline className="inline-block mr-2" />
								Add parameter
							</button>
						</div>
					</SettingsSection>
					<SettingsSection title="Web UI authorization" className="pt-5 space-y-3">
						<p className="text-sm text-slate-500">
							Authorize web UI users based on JWT access token claims, such as <code>aud</code> or{' '}
							<code>sub</code>. Authorized users can sign in to this website.
						</p>
						<p className="text-sm text-slate-500">
							By default only token issuer and expiration are verified.
						</p>
						{config.auth.oidc.webClientClaims.map((claim, idx) => (
							<div key={idx} className="flex items-center py-2 space-x-2">
								<ValidatedInput
									className="basis-[8rem]"
									onChange={(evt) => onChangeWebClientClaimsKey(idx, evt.target.value)}
									value={claim.key}
									placeholder="Key"
									error={validationErrors[`auth.webClientClaims.${idx}.key`]?.message}
								/>
								<ValidatedInput
									className="grow"
									onChange={(evt) => onChangeWebClientClaimsValue(idx, evt.target.value)}
									value={claim.value}
									placeholder="Value"
									error={validationErrors[`auth.webClientClaims.${idx}.value`]?.message}
								/>
								<button
									className="hover:bg-slate-100 rounded-full w-[2rem] h-[2rem] flex justify-center items-center"
									onClick={() => onDeleteWebClientClaim(idx)}
								>
									<RiDeleteBinLine className="text-red-500 text-lg" />
								</button>
							</div>
						))}
						<button
							className="py-1 text-sm text-sky-600 hover:text-sky-500 flex items-center"
							onClick={onAddWebClientClaim}
						>
							<MdAddCircleOutline className="inline-block mr-2" />
							Add claim
						</button>
					</SettingsSection>
					<SettingsSection title="Log client authorization" className="py-5 space-y-3">
						<p className="text-sm text-slate-500">
							Authorize log clients based on JWT access token claims, such as <code>aud</code> or{' '}
							<code>sub</code>. Authorized clients can send logs to Bulog. A "log client" typically
							refers to the <code>bulog forward</code> CLI.
						</p>
						<p className="text-sm text-slate-500">
							By default only token issuer and expiration are verified.
						</p>
						{config.auth.oidc.logClientClaims.map((claim, idx) => (
							<div key={idx} className="flex items-center py-2 space-x-2">
								<ValidatedInput
									className="basis-[8rem]"
									onChange={(evt) => onChangeLogClientClaimsKey(idx, evt.target.value)}
									value={claim.key}
									placeholder="Key"
									error={validationErrors[`auth.logClientClaims.${idx}.key`]?.message}
								/>
								<ValidatedInput
									className="grow"
									onChange={(evt) => onChangeLogClientClaimsValue(idx, evt.target.value)}
									value={claim.value}
									placeholder="Value"
									error={validationErrors[`auth.logClientClaims.${idx}.value`]?.message}
								/>
								<button
									className="hover:bg-slate-100 rounded-full w-[2rem] h-[2rem] flex justify-center items-center"
									onClick={() => onDeleteLogClientClaim(idx)}
								>
									<RiDeleteBinLine className="text-red-500 text-lg" />
								</button>
							</div>
						))}
						<button
							className="py-1 text-sm text-sky-600 hover:text-sky-500 flex items-center"
							onClick={onAddLogClientClaim}
						>
							<MdAddCircleOutline className="inline-block mr-2" />
							Add claim
						</button>
					</SettingsSection>
				</>
			)}
		</div>
	);
}
