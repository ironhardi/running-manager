import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Table(props: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-black/5 bg-white">
      <table className={clsx("w-full text-sm text-slate-700", props.className)}>
        {props.children}
      </table>
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="bg-slate-50 text-slate-600">
      {props.children}
    </thead>
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="[&>tr:nth-child(even)]:bg-slate-50/60">{props.children}</tbody>;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b last:border-0">{props.children}</tr>;
}

export function TH(props: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="text-left font-semibold px-4 py-3">{props.children}</th>
  );
}

export function TD(props: HTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-4 py-3">{props.children}</td>;
}