import { useCallback } from "react";

interface BucketProps {
    bucket: string;
    selected: boolean;
    onClick: (bucket: string) => void;
}

export default function BucketTab(props: BucketProps) {
    const { onClick, bucket, selected } = props;

    const onClickBucket = useCallback(() => {
        onClick(bucket);
    }, [onClick, bucket]);

    return (
        <div
            data-selected={selected || undefined}
            className="group w-full flex items-center justify-start py-3 pl-10 data-[selected=true]:bg-sky-500 data-[selected=true]:shadow-lg"
            onClick={onClickBucket}
        >
            <span className="text-ellipsis overflow-hidden whitespace-nowrap text-xs font-medium text-gray-300 group-hover:text-gray-300 group-data-[selected=true]:text-gray-800 group-data-[selected=true]:text-white">
                {bucket}
            </span>
        </div>
    );
}