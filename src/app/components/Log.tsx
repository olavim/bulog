import { useEffect, useState } from 'react';
import { LogCell } from './LogCell';
import { LogData, ColumnConfig, JSONValue } from '@/types';

interface LogProps {
	log: LogData;
	last: boolean;
	columns: ColumnConfig[];
	prerender?: JSONValue[];
	renderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;
}

export function Log(props: LogProps) {
	const { log, columns, renderer, prerender, last } = props;
	const [render, setRender] = useState<JSONValue[]>([]);

	useEffect(() => {
		renderer([log]).then((groups) => {
			setRender(columns.map((col) => groups[0][col.id]));
		});
	}, [columns, log, prerender, renderer]);

	return (
		<>
			{columns.map((col, index) => (
				<LogCell
					key={index}
					last={last}
					value={prerender ? prerender[index] : render[index]}
					width={col.width}
					grow={index === columns.length - 1}
				/>
			))}
		</>
	);
}
