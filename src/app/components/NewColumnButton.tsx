import { useCallback } from 'react';
import { RiInsertColumnRight } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';

interface NewColumnButtonProps {
    onClick: (id: string, data: Partial<ColumnData> | null) => void;
}

export default function NewColumnButton(props: NewColumnButtonProps) {
    const { onClick } = props;

    const handleClick = useCallback(() => {
        onClick(uuidv4(), {});
    }, [onClick]);

    return (
        <button
            className="h-[35px] inline-flex flex-row items-center bg-slate-300 hover:bg-slate-200 text-slate-500 font-medium px-2 rounded shadow ml-2"
            data-tooltip-id="tooltip"
            data-tooltip-content="New column"
            onClick={handleClick}
        >
            <RiInsertColumnRight className="text-2xl" />
        </button>
    );
}
