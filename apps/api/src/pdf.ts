import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import type { Expense, Group } from "./types";
import { round2 } from "./utils";

export async function generateGroupPdf(
  g: Group,
  expenses: Expense[],
  balances: Record<string, number>
): Promise<Buffer> {
  const styles = StyleSheet.create({
    page: { padding: 24 },
    h1: { fontSize: 18, marginBottom: 12 },
    section: { marginBottom: 12 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  });

  const expenseViews = expenses.map((e) => (
    React.createElement(
      View as any,
      { style: styles.row },
      React.createElement(Text as any, {}, `${new Date(e.date).toLocaleDateString()} - ${e.title} (${e.category})`),
      React.createElement(
        Text as any,
        {},
        `${e.amount} ${e.currency} by ${g.members.find((m) => m.id === e.paidBy)?.name || e.paidBy}`
      )
    )
  ));

  const balanceViews = g.members.map((m) => (
    React.createElement(
      View as any,
      { style: styles.row },
      React.createElement(Text as any, {}, m.name),
      React.createElement(Text as any, {}, `${round2(balances[m.id] || 0)} ${g.currency}`)
    )
  ));

  const doc = React.createElement(
    Document as any,
    {},
    React.createElement(
      Page as any,
      { size: "A4", style: styles.page },
      React.createElement(Text as any, { style: styles.h1 }, `Group Summary: ${g.name}`),
      React.createElement(
        View as any,
        { style: styles.section },
        React.createElement(Text as any, {}, `Currency: ${g.currency}`),
        React.createElement(
          Text as any,
          {},
          `Members: ${g.members.map((m) => m.name).join(", ")}`
        )
      ),
      React.createElement(View as any, { style: styles.section }, React.createElement(Text as any, {}, "Expenses"), ...expenseViews),
      React.createElement(View as any, { style: styles.section }, React.createElement(Text as any, {}, "Balances"), ...balanceViews)
    )
  );

  const buf: any = await pdf(doc).toBuffer();
  return buf as Buffer;
}
