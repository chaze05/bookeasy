import {
  Body,
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

interface BookingReceivedEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
}

export const BookingReceivedEmail = ({
  customerName,
  businessName,
  serviceName,
  date,
  time,
}: BookingReceivedEmailProps) => {
  const previewText = `Your booking request for ${serviceName} is pending review.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Booking Request Received</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              Thank you for booking with <strong>{businessName}</strong>. We have received your request and it is currently <strong>pending review</strong>. 
            </Text>
            
            <Section style={detailsContainer}>
              <Heading as="h3" style={h3}>Booking Details</Heading>
              <Text style={detailItem}><strong>Service:</strong> {serviceName}</Text>
              <Text style={detailItem}><strong>Date:</strong> {date}</Text>
              <Text style={detailItem}><strong>Time:</strong> {time}</Text>
            </Section>
            
            <Text style={text}>
              We will send you another email as soon as your booking is confirmed. If you have any questions in the meantime, feel free to reply to this email.
            </Text>
            
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

export default BookingReceivedEmail;

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

const content = {
  padding: "48px",
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
  padding: "24px",
  marginBottom: "32px",
};

const h3 = {
  color: "#18181b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const detailItem = {
  color: "#52525b",
  fontSize: "15px",
  margin: "8px 0",
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
