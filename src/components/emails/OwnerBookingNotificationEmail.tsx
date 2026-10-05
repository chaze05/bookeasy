import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OwnerBookingNotificationEmailProps {
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceName: string;
  price?: string;
  currency?: string;
  partySize?: number;
  extras?: string;
  depositAmount?: string;
  balanceAmount?: string;
  date: string;
  time: string;
  notes?: string | null;
  confirmUrl: string;
  declineUrl: string;
}

export const OwnerBookingNotificationEmail = ({
  businessName,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  price,
  currency,
  partySize,
  extras,
  depositAmount,
  balanceAmount,
  date,
  time,
  notes,
  confirmUrl,
  declineUrl,
}: OwnerBookingNotificationEmailProps) => {
  const previewText = `New booking from ${customerName} — ${serviceName} on ${date} at ${time}`;
  const money = (amount: string) => `${currency ? `${currency} ` : ""}${amount}`;
  const amount = price ? money(price) : null;
  const hasDeposit = Boolean(depositAmount && Number(depositAmount) > 0);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>New Booking Request</Heading>
            <Text style={headerSub}>{businessName}</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>
              You have a new booking request. Review the details below and confirm or decline it.
            </Text>

            <Section style={detailsContainer}>
              <Heading as="h3" style={h3}>Booking details</Heading>
              <Text style={detailItem}><strong>Service:</strong> {serviceName}</Text>
              {partySize && partySize > 1 ? (
                <Text style={detailItem}><strong>Guests:</strong> {partySize}</Text>
              ) : null}
              {extras ? (
                <Text style={detailItem}><strong>Extras:</strong> {extras}</Text>
              ) : null}
              <Text style={detailItem}><strong>Date:</strong> {date}</Text>
              <Text style={detailItem}><strong>Time:</strong> {time}</Text>
              {amount ? <Text style={detailItem}><strong>Price:</strong> {amount}</Text> : null}
              {hasDeposit && depositAmount ? (
                <>
                  <Text style={detailItem}><strong>Deposit due now:</strong> {money(depositAmount)}</Text>
                  {balanceAmount ? (
                    <Text style={detailItem}><strong>Balance at appointment:</strong> {money(balanceAmount)}</Text>
                  ) : null}
                </>
              ) : null}
            </Section>

            <Section style={detailsContainer}>
              <Heading as="h3" style={h3}>Customer</Heading>
              <Text style={detailItem}><strong>Name:</strong> {customerName}</Text>
              <Text style={detailItem}><strong>Email:</strong> {customerEmail}</Text>
              {customerPhone ? (
                <Text style={detailItem}><strong>Phone:</strong> {customerPhone}</Text>
              ) : null}
              {notes ? <Text style={detailItem}><strong>Notes:</strong> {notes}</Text> : null}
            </Section>

            <Row style={buttonRow}>
              <Column align="center">
                <Button style={confirmButton} href={confirmUrl}>
                  Confirm booking
                </Button>
              </Column>
              <Column align="center">
                <Button style={declineButton} href={declineUrl}>
                  Decline
                </Button>
              </Column>
            </Row>

            <Text style={hint}>
              The customer will be emailed automatically when you confirm. Links expire in 30 days, and
              you can always manage this booking from your dashboard.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>Sent by BookEasy on behalf of {businessName}.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OwnerBookingNotificationEmail;

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "40px auto",
  width: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e4e4e7",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const header = {
  backgroundColor: "#10b981",
  padding: "32px 48px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.2",
  margin: "0",
};

const headerSub = {
  color: "#d1fae5",
  fontSize: "14px",
  margin: "8px 0 0 0",
};

const content = {
  padding: "40px 48px",
};

const text = {
  color: "#3f3f46",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "24px",
};

const detailsContainer = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "20px 24px",
  marginBottom: "20px",
};

const h3 = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const detailItem = {
  color: "#52525b",
  fontSize: "15px",
  margin: "6px 0",
};

const buttonRow = {
  margin: "8px 0 4px 0",
};

const baseButton = {
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};

const confirmButton = {
  ...baseButton,
  backgroundColor: "#10b981",
  color: "#ffffff",
};

const declineButton = {
  ...baseButton,
  backgroundColor: "#ffffff",
  color: "#52525b",
  border: "1px solid #d4d4d8",
};

const hint = {
  color: "#a1a1aa",
  fontSize: "13px",
  lineHeight: "20px",
  marginTop: "20px",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#e4e4e7",
  margin: "32px 0",
};

const footer = {
  color: "#a1a1aa",
  fontSize: "13px",
  textAlign: "center" as const,
};
