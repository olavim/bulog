import { useCallback } from "react";

interface TabProps {
    title: string;
    selected: boolean;
    onClick: (title: string) => void;
}

export default function Tab(props: TabProps) {
    const { onClick, title, selected } = props;

    const handleClick = useCallback(() => {
        onClick(title);
    }, [onClick, title]);

    return (
        <div
            data-selected={selected || undefined}
            className="group w-full flex items-center justify-start py-3 pl-10 pr-6 cursor-pointer hover:bg-slate-600 data-[selected=true]:bg-sky-500 data-[selected=true]:shadow-lg data-[selected=true]:cursor-default"
            onClick={handleClick}
        >
            <span className="text-ellipsis overflow-hidden whitespace-nowrap text-xs font-medium text-gray-300 group-hover:text-gray-200 group-data-[selected=true]:text-gray-800 group-data-[selected=true]:text-white">
                {title}
            </span>
        </div>
    );
}