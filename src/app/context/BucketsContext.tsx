import {
	defaultFormatterString,
	defaultLogRenderer,
	defaultTimestampFormatterString
} from '@/hooks/useColumnUtils';
import { Dispatch, Reducer, createContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

type BucketsContextType = {
	buckets: Map<string, BucketData>;
	shouldSave: boolean;
	configLoaded: boolean;
};

type BucketsReducerActionType =
	| { type: 'addLogs'; bucket: string; logs: LogData[] }
	| { type: 'setShouldSave'; shouldSave: boolean }
	| { type: 'loadConfig'; bucket: string; config: BucketData }
	| { type: 'setColumns'; bucket: string; columns: ColumnData[] }
	| {
			type: 'setLogRenderer';
			bucket: string;
			logRenderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;
	  };

const initialContext = { buckets: new Map(), shouldSave: false, configLoaded: false };

export const BucketsContext = createContext<
	[BucketsContextType, Dispatch<BucketsReducerActionType>]
>([initialContext, () => {}]);

const bucketsReducer: Reducer<BucketsContextType, BucketsReducerActionType> = (ctx, action) => {
	const ctxCopy = { ...ctx, buckets: new Map(ctx.buckets) };

	switch (action.type) {
		case 'addLogs': {
			const bucket = ctxCopy.buckets.get(action.bucket)!;
			const defaultTimestampColumnId = uuidv4();
			const defaultMessageColumnId = uuidv4();

			ctxCopy.buckets.set(action.bucket, {
				logs: [...(bucket?.logs ?? []), ...action.logs],
				columns: bucket?.columns ?? [
					{
						id: defaultTimestampColumnId,
						name: 'timestamp',
						formatterString: defaultTimestampFormatterString,
						width: 220
					},
					{
						id: defaultMessageColumnId,
						name: 'message',
						formatterString: defaultFormatterString,
						width: 200
					}
				],
				logRenderer:
					bucket?.logRenderer ??
					defaultLogRenderer(defaultTimestampColumnId, defaultMessageColumnId)
			});

			return ctxCopy;
		}
		case 'loadConfig':
			ctxCopy.buckets.set(action.bucket, { ...action.config, logs: [] });
			ctxCopy.configLoaded = true;
			return ctxCopy;
		case 'setShouldSave':
			ctxCopy.shouldSave = action.shouldSave;
			return ctxCopy;
		case 'setColumns': {
			const bucket = ctxCopy.buckets.get(action.bucket)!;
			ctxCopy.buckets.set(action.bucket, { ...bucket, columns: action.columns });
			ctxCopy.shouldSave = true;
			return ctxCopy;
		}
		case 'setLogRenderer': {
			const bucket = ctxCopy.buckets.get(action.bucket)!;
			ctxCopy.buckets.set(action.bucket, { ...bucket, logRenderer: action.logRenderer });
			return ctxCopy;
		}
		default:
			return ctxCopy;
	}
};

interface BucketsProviderProps {
	children: React.ReactNode;
}

export function BucketsProvider({ children }: BucketsProviderProps) {
	const [context, dispatch] = useReducer(bucketsReducer, initialContext);

	return <BucketsContext.Provider value={[context, dispatch]}>{children}</BucketsContext.Provider>;
}
