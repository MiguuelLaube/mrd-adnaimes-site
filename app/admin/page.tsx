import { getSite } from "../../lib/store";
import Editor from "./Editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel", robots: { index: false } };

export default async function Admin() {
  return <Editor inicial={await getSite()} />;
}
