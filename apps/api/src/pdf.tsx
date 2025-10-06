import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
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

  const Doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Group Summary: {g.name}</Text>
        <View style={styles.section}>
          <Text>Currency: {g.currency}</Text>
          <Text>Members: {g.members.map((m) => m.name).join(", ")}</Text>
        </View>
        <View style={styles.section}>
          <Text>Expenses</Text>
          {expenses.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text>
                {new Date(e.date).toLocaleDateString()} - {e.title} ({e.category})
              </Text>
              <Text>
                {e.amount} {e.currency} by {g.members.find((m) => m.id === e.paidBy)?.name || e.paidBy}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text>Balances</Text>
          {g.members.map((m) => (
            <View key={m.id} style={styles.row}>
              <Text>{m.name}</Text>
              <Text>
                {round2(balances[m.id] || 0)} {g.currency}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const buf = await pdf(Doc).toBuffer();
  return buf as Buffer;
}
