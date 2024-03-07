import { MdClose } from "react-icons/md";

interface DrawerProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

export default function Drawer(props: DrawerProps) {
    const { title, children, onClose } = props;
    return (
        <div className="basis-auto grow-0 shrink-0 max-h-full min-h-full overflow-hidden flex flex-col bg-white shadow-xl">
            <div className="flex flex-col px-4 w-[35rem] justify-items-center overflow-hidden">
                <div className="flex px-2 basis-20 shrink-0 grow-0 items-center justify-between">
                    <h1 className="text-lg font-medium text-slate-600">{title}</h1>
                    <button className="p-2 rounded-full hover:bg-gray-200 cursor-pointer" onClick={onClose}>
                        <MdClose className="text-xl text-slate-600" />
                    </button>
                </div>
                <div className="overflow-auto w-full items-start justify-between border-t flex py-6 px-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
