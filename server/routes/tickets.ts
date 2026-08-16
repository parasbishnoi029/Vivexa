import { Router } from "express";

export const ticketsRouter = Router();

export interface PriorityTicketItem {
  id: string;
  subject: string;
  category: string;
  severity: "P1" | "P2" | "P3" | "P4";
  description: string;
  email: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  slaMinutes: number;
  assignedEngineer: string;
}

const mockTickets: PriorityTicketItem[] = [
  {
    id: "TICK-2026-9042",
    subject: "Zero-copy Query Latency Spike on Snowflake Finance WH",
    category: "Data Lakehouse Querying",
    severity: "P2",
    description: "Intermittent query duration increased from 40ms to 240ms during peak batch execution.",
    email: "info.vivexa@gmail.com",
    status: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    slaMinutes: 60,
    assignedEngineer: "Alex Morgan (Senior SRE)"
  },
  {
    id: "TICK-2026-8810",
    subject: "CRDT Sync Session Re-connection Timeout",
    category: "Real-time Collaboration",
    severity: "P3",
    description: "Peer connection reconnect took 4.2 seconds after network interruption.",
    email: "info.vivexa@gmail.com",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    slaMinutes: 240,
    assignedEngineer: "Elena Rostova (Distributed Systems Lead)"
  }
];

// List priority tickets
ticketsRouter.get("/", (req, res) => {
  res.json({ success: true, count: mockTickets.length, tickets: mockTickets });
});

// Submit a new enterprise priority ticket
ticketsRouter.post("/", (req, res) => {
  const { subject, category, severity, description, email } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ success: false, error: "Missing required fields: subject and description." });
  }

  const ticketId = `TICK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const slaMinutesMap = { P1: 15, P2: 60, P3: 240, P4: 1440 };
  const sev = (severity as "P1" | "P2" | "P3" | "P4") || "P2";

  const newTicket: PriorityTicketItem = {
    id: ticketId,
    subject,
    category: category || "General Support",
    severity: sev,
    description,
    email: email || "info.vivexa@gmail.com",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    slaMinutes: slaMinutesMap[sev] || 60,
    assignedEngineer: "Vivexa Automated SRE Triage Bot"
  };

  mockTickets.unshift(newTicket);
  res.status(201).json({ success: true, ticket: newTicket });
});

// Update ticket status
ticketsRouter.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { status, assignedEngineer } = req.body;

  const ticket = mockTickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: `Ticket "${id}" not found.` });
  }

  if (status) ticket.status = status;
  if (assignedEngineer) ticket.assignedEngineer = assignedEngineer;

  res.json({ success: true, ticket });
});
