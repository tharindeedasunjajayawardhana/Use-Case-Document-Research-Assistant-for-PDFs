import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, MessageSquareText, type LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryTab } from "@/components/summary/SummaryTab";
import { ChatTab } from "@/components/chat/ChatTab";
import type { ResponseLanguage } from "@/lib/types";

interface TabProps { paperId: string; lang: ResponseLanguage }

/** Add future tabs (e.g. Notes, Quiz) by appending to this list. */
const TABS: { value: string; label: string; icon: LucideIcon; Component: ComponentType<TabProps> }[] = [
  { value: "summary", label: "Summary", icon: FileText, Component: SummaryTab },
  { value: "chat", label: "Chat", icon: MessageSquareText, Component: ChatTab },
];

export function WorkspaceTabs(props: TabProps) {
  const [tab, setTab] = useState(TABS[0].value);
  const Active = TABS.find((t) => t.value === tab)?.Component ?? SummaryTab;
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="h-11 rounded-xl bg-muted p-1">
        {TABS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="h-9 gap-2 rounded-lg px-4">
            <Icon className="size-4" aria-hidden />{label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div role="tabpanel" aria-label={tab} className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Active {...props} />
          </motion.div>
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
