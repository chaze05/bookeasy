import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingReminderEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  manageUrl?: string;
}

export const BookingReminderEmail = ({
  customerName,
  businessName,
  serviceName,
  date,
  time,
  manageUrl,
}: BookingReminderEmailProps) => {
  const previewText = `Reminder: ${serviceName} with ${businessName} on ${date} at ${time}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Appointment reminder</Heading>
            <Text style={headerSub}>{businessName}</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              This is a friendly reminder about your upcoming appointment with{" "}
              <strong>{businessName}</strong>.
            </Text>

            <Section style={detailsContainer}>
              <Heading as="h3" style={h3}>Your appointment</Heading>
              <Text style={detailItem}><strong>Service:</strong> {serviceName}</Text>
              <Text style={detailItem}><strong>Date:</strong> {date}</Text>
              <Text style={detailItem}><strong>Time:</strong> {time}</Text>
            </Section>

            {manageUrl ? (
              <Section style={buttonContainer}>
                <Button style={button} href={manageUrl}>
                  Reschedule or cancel
                </Button>
                <Text style={buttonHint}>
                  Plans changed? Use this link to pick another time before your appointment.
                </Text>
              </Section>
            ) : null}

            <Hr style={hr} />
            <Text style={footer}>
              Sent securely via BookEasy on behalf of {businessName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingReminderEmail;

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
  marginBottom: "24px",
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "8px 0 24px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};

const buttonHint = {
  color: "#a1a1aa",
  fontSize: "12px",
  marginTop: "10px",
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
