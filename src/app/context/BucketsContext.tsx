import { defaultFormatterFunction, defaultFormatterString, defaultTimestampFormatterFunction, defaultTimestampFormatterString } from "@/hooks/useColumnUtils";
import { Dispatch, Reducer, createContext, useReducer } from "react";
import { v4 as uuidv4 } from 'uuid';

type BucketsContextType = {
    buckets: Map<string, BucketData>
};

type BucketsReducerActionType =
    { type: 'addLogs', bucket: string; logs: LogData[] }
    | { type: 'setColumns', bucket: string; columns: ColumnData[] }
    | { type: 'setColumnWidths', bucket: string; columnWidths: number[] };

const initialContext = { buckets: new Map() };

export const BucketsContext = createContext<[BucketsContextType, Dispatch<BucketsReducerActionType>]>([initialContext, () => { }]);

const bucketsReducer: Reducer<BucketsContextType, BucketsReducerActionType> = (ctx, action) => {
    const ctxCopy = { buckets: new Map(ctx.buckets) };
    const bucket = ctxCopy.buckets.get(action.bucket)!;

    switch (action.type) {
        case 'addLogs':
            ctxCopy.buckets.set(action.bucket, {
                logs: [...(bucket?.logs ?? []), ...action.logs],
                columns: bucket?.columns ?? [
                    { id: uuidv4(), name: 'timestamp', formatterString: defaultTimestampFormatterString, formatterFunction: defaultTimestampFormatterFunction, width: 220 },
                    { id: uuidv4(), name: 'message', formatterString: defaultFormatterString, formatterFunction: defaultFormatterFunction, width: 200 }
                ]
            });
            return ctxCopy;
        case 'setColumns':
            ctxCopy.buckets.set(action.bucket, { ...bucket, columns: action.columns });
            return ctxCopy;
        default:
            return ctxCopy;
    }
};

interface BucketsProviderProps {
    children: React.ReactNode;
}

export function BucketsProvider({ children }: BucketsProviderProps) {
    const [context, dispatch] = useReducer(bucketsReducer, initialContext);

    return (
        <BucketsContext.Provider value={[context, dispatch]}>
            {children}
        </BucketsContext.Provider>
    );
}
