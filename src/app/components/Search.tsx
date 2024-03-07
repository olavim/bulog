import { useCallback, useEffect, useState } from "react";
import ReactDOMServer from "react-dom/server";
import { FaQuestionCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { LiqeQuery, parse as liqeParse } from 'liqe';

interface SearchProps {
    onSearch: (query: LiqeQuery | null) => void;
}

export default function Search(props: SearchProps) {
    const { onSearch } = props;

    const [searchStr, setSearchStr] = useState<string>('');
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        setSearchStr(evt.target.value);
    }, []);

    useEffect(() => {
        if (!searchStr) {
            onSearch(null);
            setSearchError(null);
            return;
        }

        try {
            const query = liqeParse(searchStr);
            onSearch(query);
            setSearchError(null);
        } catch (err: any) {
            setSearchError(err.message);
        }
    }, [onSearch, searchStr]);

    return (
        <div className="flex grow items-center">
            <span className="relative basis-60 shrink-0">
                <MdSearch className="absolute left-2 translate-y-[-50%] top-1/2 my-auto text-gray-500 text-xl" />
                <input
                    type="text"
                    value={searchStr}
                    onChange={handleChange}
                    placeholder="Search..."
                    data-error={searchError ?? undefined}
                    className="w-full text-xs border border-gray-300 rounded py-2 pl-8 pr-1 text-gray-700 data-[error]:outline-red-500 data-[error]:outline-2"
                />
            </span>
            <a
                data-tooltip-id="tooltip"
                data-tooltip-html={ReactDOMServer.renderToStaticMarkup(
                    <div className="text-sm">
                        The search supports <a href="https://github.com/gajus/liqe#readme" rel="noreferrer noopener" target="_blank" className="font-semibold underline">Liqe</a> syntax
                    </div>
                )}
                data-tooltip-variant="info"
                className="ml-4 cursor-pointer"
            >
                <FaQuestionCircle className="text-sky-600 text-lg" />
            </a>
        </div>
    );
}