interface CardProps {
	className?: string;
	children: React.ReactNode;
	innerRef?: React.RefObject<HTMLDivElement>;
}

export default function Card(props: CardProps) {
	const { className, children, innerRef } = props;

	return (
		<div ref={innerRef} className={`flex flex-col bg-white rounded shadow ${className ?? ''}`}>
			{children}
		</div>
	);
}
