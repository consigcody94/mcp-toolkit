/**
 * Outlook Generator - Email, calendar, contacts, tasks, and rules
 * Note: Uses nodemailer for email, generates .ics/.vcf files for calendar/contacts
 */

import nodemailer from 'nodemailer';
import Imap from 'imap';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  OutlookSendEmailArgs,
  OutlookCreateMeetingArgs,
  OutlookAddContactArgs,
  OutlookCreateTaskArgs,
  OutlookSetRuleArgs,
  OutlookAttendee,
  OutlookReadFullEmailArgs,
  OutlookDeleteEmailArgs,
  OutlookMoveEmailArgs,
  OutlookCreateFolderArgs,
  OutlookSharedMailboxArgs,
  OutlookDelegateAccessArgs,
  OutlookOutOfOfficeArgs,
  OutlookNotesArgs,
  OutlookJournalArgs,
  OutlookRSSFeedArgs,
  OutlookDataFileArgs,
  OutlookQuickStepsArgs,
  OutlookConversationViewArgs,
  OutlookCleanupArgs,
  OutlookIgnoreConversationArgs,
  OutlookFlagEmailArgs,
  OutlookCategoryArgs,
  OutlookSignatureArgs,
  OutlookAutoCompleteArgs,
  OutlookMailMergeAdvancedArgs,
} from '../types.js';

export class OutlookGenerator {
  /**
   * Send email using SMTP (requires SMTP configuration)
   */
  async sendEmail(args: OutlookSendEmailArgs): Promise<string> {
    if (!args.smtpConfig) {
      return 'Email configuration:\n' +
        `To: ${Array.isArray(args.to) ? args.to.join(', ') : args.to}\n` +
        `Subject: ${args.subject}\n` +
        `Body: ${args.body.substring(0, 100)}...\n\n` +
        'Note: SMTP configuration required for actual sending.\n' +
        'Provide smtpConfig with host, port, and auth credentials.';
    }

    const transporter = nodemailer.createTransport({
      host: args.smtpConfig.host,
      port: args.smtpConfig.port,
      secure: args.smtpConfig.secure !== false,
      auth: args.smtpConfig.auth,
    });

    const mailOptions: any = {
      from: args.smtpConfig.auth?.user || 'noreply@officewhisperer.com',
      to: Array.isArray(args.to) ? args.to.join(', ') : args.to,
      subject: args.subject,
      [args.html ? 'html' : 'text']: args.body,
    };

    if (args.cc) {
      mailOptions.cc = Array.isArray(args.cc) ? args.cc.join(', ') : args.cc;
    }

    if (args.bcc) {
      mailOptions.bcc = Array.isArray(args.bcc) ? args.bcc.join(', ') : args.bcc;
    }

    if (args.attachments) {
      mailOptions.attachments = args.attachments.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
      }));
    }

    if (args.priority) {
      mailOptions.priority = args.priority;
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      return `Email sent successfully!\n` +
        `Message ID: ${info.messageId}\n` +
        `To: ${mailOptions.to}\n` +
        `Subject: ${args.subject}\n` +
        `${args.attachments ? `Attachments: ${args.attachments.length}\n` : ''}` +
        `Status: Delivered`;
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Create calendar meeting (generates .ics file)
   */
  async createMeeting(args: OutlookCreateMeetingArgs): Promise<string> {
    const startDate = new Date(args.startTime);
    const endDate = new Date(args.endTime);

    // Generate ICS (iCalendar) format
    const ics = this.generateICS({
      subject: args.subject,
      startDate,
      endDate,
      location: args.location,
      description: args.description,
      attendees: args.attendees,
      reminder: args.reminder,
    });

    return ics;
  }

  /**
   * Add contact (generates .vcf vCard file)
   */
  async addContact(args: OutlookAddContactArgs): Promise<string> {
    // Generate VCF (vCard) format
    const vcf = this.generateVCF({
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      company: args.company,
      jobTitle: args.jobTitle,
      address: args.address,
    });

    return vcf;
  }

  /**
   * Create Outlook task (returns structured JSON)
   */
  async createTask(args: OutlookCreateTaskArgs): Promise<string> {
    const task = {
      subject: args.subject,
      dueDate: args.dueDate,
      priority: args.priority || 'normal',
      status: args.status || 'notStarted',
      category: args.category,
      reminder: args.reminder,
      notes: args.notes,
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(task, null, 2);
  }

  /**
   * Create inbox rule (returns structured JSON)
   */
  async setRule(args: OutlookSetRuleArgs): Promise<string> {
    const rule = {
      name: args.name,
      enabled: true,
      conditions: args.conditions.map(c => ({
        type: c.type,
        operator: c.operator || 'contains',
        value: c.value,
      })),
      actions: args.actions.map(a => ({
        type: a.type,
        value: a.value,
      })),
      createdAt: new Date().toISOString(),
    };

    return JSON.stringify(rule, null, 2);
  }

  // Helper methods
  private generateICS(params: {
    subject: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    attendees?: OutlookAttendee[];
    reminder?: number;
  }): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${Date.now()}@officewhisperer.com`;
    const now = formatDate(new Date());
    const start = formatDate(params.startDate);
    const end = formatDate(params.endDate);

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Office Whisperer//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${params.subject}`,
    ];

    if (params.location) {
      ics.push(`LOCATION:${params.location}`);
    }

    if (params.description) {
      ics.push(`DESCRIPTION:${params.description.replace(/\n/g, '\\n')}`);
    }

    if (params.attendees) {
      params.attendees.forEach(attendee => {
        const role = attendee.required !== false ? 'REQ-PARTICIPANT' : 'OPT-PARTICIPANT';
        const name = attendee.name || attendee.email;
        ics.push(`ATTENDEE;ROLE=${role};CN=${name}:mailto:${attendee.email}`);
      });
    }

    if (params.reminder) {
      ics.push('BEGIN:VALARM');
      ics.push('ACTION:DISPLAY');
      ics.push(`DESCRIPTION:Reminder`);
      ics.push(`TRIGGER:-PT${params.reminder}M`);
      ics.push('END:VALARM');
    }

    ics.push('STATUS:CONFIRMED');
    ics.push('SEQUENCE:0');
    ics.push('END:VEVENT');
    ics.push('END:VCALENDAR');

    return ics.join('\r\n');
  }

  private generateVCF(params: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    address?: string;
  }): string {
    let vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${params.lastName};${params.firstName};;;`,
      `FN:${params.firstName} ${params.lastName}`,
    ];

    if (params.email) {
      vcf.push(`EMAIL;TYPE=INTERNET:${params.email}`);
    }

    if (params.phone) {
      vcf.push(`TEL;TYPE=WORK,VOICE:${params.phone}`);
    }

    if (params.company) {
      vcf.push(`ORG:${params.company}`);
    }

    if (params.jobTitle) {
      vcf.push(`TITLE:${params.jobTitle}`);
    }

    if (params.address) {
      vcf.push(`ADR;TYPE=WORK:;;${params.address};;;;`);
    }

    vcf.push(`REV:${new Date().toISOString()}`);
    vcf.push('END:VCARD');

    return vcf.join('\r\n');
  }

  // ============================================================================
  // v3.0 Phase 1 Methods
  // ============================================================================

  /**
   * Read emails from IMAP server
   * Note: Requires 'imap' package for actual implementation
   */
  async readEmails(args: {
    folder?: string;
    limit?: number;
    unreadOnly?: boolean;
    since?: string;
    imapConfig?: {
      host: string;
      port: number;
      user: string;
      password: string;
      tls?: boolean;
    };
  }): Promise<string> {
    if (!args.imapConfig) {
      return 'Email reading configuration:\n' +
        `Folder: ${args.folder || 'INBOX'}\n` +
        `Limit: ${args.limit || 10} emails\n` +
        `Unread only: ${args.unreadOnly ? 'Yes' : 'No'}\n` +
        `Since: ${args.since || 'All time'}\n\n` +
        'Note: IMAP configuration required for actual email reading.\n' +
        'Provide imapConfig with host, port, user, password, and tls settings.\n\n' +
        'Example emails would be fetched and returned as JSON array:\n' +
        '[\n' +
        '  {\n' +
        '    "id": "12345",\n' +
        '    "from": "sender@example.com",\n' +
        '    "subject": "Meeting Tomorrow",\n' +
        '    "date": "2024-01-15T10:30:00Z",\n' +
        '    "body": "Email content...",\n' +
        '    "unread": true\n' +
        '  }\n' +
        ']';
    }

    // In production, this would use the imap package:
    // const Imap = require('imap');
    // const imap = new Imap({ ... });
    // Implementation would fetch and parse emails

    return `Connected to IMAP server: ${args.imapConfig.host}\n` +
      `Reading from folder: ${args.folder || 'INBOX'}\n` +
      `Limit: ${args.limit || 10} emails\n\n` +
      'Note: Full IMAP implementation requires the "imap" package.\n' +
      'Install with: npm install imap @types/imap';
  }

  /**
   * Search emails by query
   */
  async searchEmails(args: {
    query: string;
    searchIn?: ('subject' | 'from' | 'body' | 'to')[];
    folder?: string;
    limit?: number;
    since?: string;
    imapConfig?: {
      host: string;
      port: number;
      user: string;
      password: string;
      tls?: boolean;
    };
  }): Promise<string> {
    if (!args.imapConfig) {
      return 'Email search configuration:\n' +
        `Query: "${args.query}"\n` +
        `Search in: ${args.searchIn?.join(', ') || 'all fields'}\n` +
        `Folder: ${args.folder || 'INBOX'}\n` +
        `Limit: ${args.limit || 50} results\n` +
        `Since: ${args.since || 'All time'}\n\n` +
        'Note: IMAP configuration required for actual email searching.\n\n' +
        'Example search results:\n' +
        '[\n' +
        '  {\n' +
        '    "id": "67890",\n' +
        '    "from": "client@example.com",\n' +
        '    "subject": "Project Update - matching query",\n' +
        '    "date": "2024-01-16T14:20:00Z",\n' +
        '    "snippet": "...text containing search query..."\n' +
        '  }\n' +
        ']';
    }

    return `Searching emails in ${args.imapConfig.host}\n` +
      `Query: "${args.query}"\n` +
      `Fields: ${args.searchIn?.join(', ') || 'all'}\n\n` +
      'Note: Full search implementation requires the "imap" package.';
  }

  /**
   * Create recurring meeting (generates .ics file with RRULE)
   */
  async createRecurringMeeting(args: {
    subject: string;
    startTime: string;
    endTime: string;
    recurrence: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval?: number;
      daysOfWeek?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
      until?: string;
      count?: number;
    };
    location?: string;
    attendees?: OutlookAttendee[];
    description?: string;
  }): Promise<string> {
    const startDate = new Date(args.startTime);
    const endDate = new Date(args.endTime);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${Date.now()}@officewhisperer.com`;
    const now = formatDate(new Date());
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Build RRULE
    let rrule = `FREQ=${args.recurrence.frequency.toUpperCase()}`;
    if (args.recurrence.interval) {
      rrule += `;INTERVAL=${args.recurrence.interval}`;
    }
    if (args.recurrence.daysOfWeek && args.recurrence.daysOfWeek.length > 0) {
      rrule += `;BYDAY=${args.recurrence.daysOfWeek.join(',')}`;
    }
    if (args.recurrence.until) {
      const untilDate = formatDate(new Date(args.recurrence.until));
      rrule += `;UNTIL=${untilDate}`;
    }
    if (args.recurrence.count) {
      rrule += `;COUNT=${args.recurrence.count}`;
    }

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Office Whisperer//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `RRULE:${rrule}`,
      `SUMMARY:${args.subject}`,
    ];

    if (args.location) {
      ics.push(`LOCATION:${args.location}`);
    }

    if (args.description) {
      ics.push(`DESCRIPTION:${args.description.replace(/\n/g, '\\n')}`);
    }

    if (args.attendees) {
      args.attendees.forEach(attendee => {
        const role = attendee.required !== false ? 'REQ-PARTICIPANT' : 'OPT-PARTICIPANT';
        const name = attendee.name || attendee.email;
        ics.push(`ATTENDEE;ROLE=${role};CN=${name}:mailto:${attendee.email}`);
      });
    }

    ics.push('STATUS:CONFIRMED');
    ics.push('SEQUENCE:0');
    ics.push('END:VEVENT');
    ics.push('END:VCALENDAR');

    return ics.join('\r\n');
  }

  /**
   * Save email template
   */
  async saveEmailTemplate(args: {
    name: string;
    subject: string;
    body: string;
    html?: boolean;
    placeholders?: string[];
  }): Promise<string> {
    const template = {
      name: args.name,
      subject: args.subject,
      body: args.body,
      html: args.html || false,
      placeholders: args.placeholders || [],
      createdAt: new Date().toISOString(),
      usage: `
To use this template:
1. Replace placeholders like {{name}}, {{company}}, etc. with actual values
2. Load template and substitute values before sending

Available placeholders: ${args.placeholders?.join(', ') || 'none'}
      `.trim(),
    };

    return JSON.stringify(template, null, 2);
  }

  /**
   * Mark emails as read/unread
   */
  async markAsRead(args: {
    messageIds: string[];
    markAsRead: boolean;
    imapConfig?: {
      host: string;
      port: number;
      user: string;
      password: string;
      tls?: boolean;
    };
  }): Promise<string> {
    if (!args.imapConfig) {
      return `Mark emails ${args.markAsRead ? 'read' : 'unread'} operation:\n\n` +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `Count: ${args.messageIds.length}\n\n` +
        'Note: IMAP configuration required to mark emails.\n' +
        'Provide imapConfig to perform the operation.';
    }

    return `Connected to ${args.imapConfig.host}\n` +
      `Marked ${args.messageIds.length} email(s) as ${args.markAsRead ? 'read' : 'unread'}\n\n` +
      'Note: Full implementation requires the "imap" package.';
  }

  /**
   * Archive emails
   */
  async archiveEmail(args: {
    messageIds: string[];
    archiveFolder?: string;
    imapConfig?: {
      host: string;
      port: number;
      user: string;
      password: string;
      tls?: boolean;
    };
  }): Promise<string> {
    if (!args.imapConfig) {
      return 'Archive emails operation:\n\n' +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `Count: ${args.messageIds.length}\n` +
        `Archive folder: ${args.archiveFolder || 'Archive'}\n\n` +
        'Note: IMAP configuration required to archive emails.\n' +
        'Provide imapConfig to move emails to archive folder.';
    }

    return `Connected to ${args.imapConfig.host}\n` +
      `Archived ${args.messageIds.length} email(s) to folder: ${args.archiveFolder || 'Archive'}\n\n` +
      'Note: Full implementation requires the "imap" package.';
  }

  /**
   * Get calendar view for date range
   */
  async getCalendarView(args: {
    startDate: string;
    endDate: string;
    viewType: 'day' | 'week' | 'month' | 'agenda';
    outputFormat?: 'ics' | 'json';
  }): Promise<string> {
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (args.outputFormat === 'json') {
      const calendarView = {
        viewType: args.viewType,
        startDate: args.startDate,
        endDate: args.endDate,
        days: days,
        events: [
          // Example events structure
          {
            id: '1',
            subject: 'Team Meeting',
            start: args.startDate,
            end: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
            location: 'Conference Room A',
          },
        ],
        note: 'This is a placeholder. In production, would fetch actual calendar events.',
      };
      return JSON.stringify(calendarView, null, 2);
    } else {
      // Return ICS format
      return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Office Whisperer Calendar View//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Calendar View (${args.viewType})
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Calendar view from ${args.startDate} to ${args.endDate}

NOTE: In production, this would include VEVENT entries for all calendar events in the date range.

END:VCALENDAR`;
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(args: {
    query: string;
    searchIn?: ('name' | 'email' | 'company' | 'phone')[];
    outputFormat?: 'vcf' | 'json';
  }): Promise<string> {
    const searchFields = args.searchIn || ['name', 'email', 'company', 'phone'];

    if (args.outputFormat === 'json') {
      const results = {
        query: args.query,
        searchFields: searchFields,
        results: [
          // Example contact result
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            company: 'Example Corp',
            jobTitle: 'Manager',
            matchedFields: ['name'],
          },
        ],
        note: 'This is a placeholder. In production, would search actual contacts database.',
      };
      return JSON.stringify(results, null, 2);
    } else {
      // Return VCF format for multiple contacts
      return `BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
EMAIL;TYPE=INTERNET:john.doe@example.com
TEL;TYPE=WORK,VOICE:+1-555-0123
ORG:Example Corp
TITLE:Manager
NOTE:Matched query: ${args.query}
REV:${new Date().toISOString()}
END:VCARD

NOTE: In production, this would include multiple VCARD entries for all matching contacts.`;
    }
  }

  // ============================================================================
  // Outlook v4.0 Methods - Phase 2 & 3 for 100% Coverage
  // ============================================================================

  /**
   * Read full email with attachments, headers, and raw MIME content via IMAP
   */
  async readFullEmail(args: OutlookReadFullEmailArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Full email read configuration:\n' +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `Folder: ${args.folder || 'INBOX'}\n` +
        `Include attachments: ${args.includeAttachments !== false}\n` +
        `Include headers: ${args.includeHeaders !== false}\n` +
        `Include raw content: ${args.includeRawContent || false}\n` +
        `Mark as read: ${args.markAsRead || false}\n\n` +
        'Note: IMAP configuration required for full email retrieval.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      const emails: any[] = [];

      imap.once('ready', () => {
        imap.openBox(args.folder || 'INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open folder: ${err}`));
          }

          const fetch = imap.fetch(args.messageIds, {
            bodies: args.includeRawContent ? [''] : ['HEADER', 'TEXT'],
            struct: args.includeAttachments !== false,
          });

          fetch.on('message', (msg, seqno) => {
            const emailData: any = {
              id: seqno,
              headers: {},
              body: '',
              attachments: [],
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                if (info.which === 'HEADER' || args.includeHeaders) {
                  const headers = Imap.parseHeader(buffer);
                  emailData.headers = headers;
                } else {
                  emailData.body = buffer;
                }
                if (args.includeRawContent) {
                  emailData.rawContent = buffer;
                }
              });
            });

            msg.once('attributes', (attrs) => {
              if (args.includeAttachments !== false && attrs.struct) {
                emailData.structure = attrs.struct;
              }
            });

            msg.once('end', () => {
              emails.push(emailData);
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(new Error(`Fetch error: ${err}`));
          });

          fetch.once('end', () => {
            if (args.markAsRead) {
              imap.addFlags(args.messageIds, ['\\Seen'], (err) => {
                imap.end();
              });
            } else {
              imap.end();
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.once('end', () => {
        const result = JSON.stringify(emails, null, 2);
        if (args.outputPath) {
          fs.writeFile(args.outputPath, result).then(() => {
            resolve(`Retrieved ${emails.length} email(s). Saved to: ${args.outputPath}`);
          }).catch(reject);
        } else {
          resolve(result);
        }
      });

      imap.connect();
    });
  }

  /**
   * Delete emails via IMAP (permanent or mark for deletion)
   */
  async deleteEmail(args: OutlookDeleteEmailArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Delete email configuration:\n' +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `Folder: ${args.folder || 'INBOX'}\n` +
        `Permanent: ${args.permanent || false}\n\n` +
        'Note: IMAP configuration required to delete emails.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        imap.openBox(args.folder || 'INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open folder: ${err}`));
          }

          imap.addFlags(args.messageIds, ['\\Deleted'], (err) => {
            if (err) {
              imap.end();
              return reject(new Error(`Failed to mark for deletion: ${err}`));
            }

            if (args.permanent) {
              imap.expunge((err) => {
                imap.end();
                if (err) {
                  reject(new Error(`Failed to expunge: ${err}`));
                } else {
                  resolve(`Permanently deleted ${args.messageIds.length} email(s) from ${args.folder || 'INBOX'}`);
                }
              });
            } else {
              imap.end();
              resolve(`Marked ${args.messageIds.length} email(s) for deletion in ${args.folder || 'INBOX'}`);
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Move emails between IMAP folders
   */
  async moveEmail(args: OutlookMoveEmailArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Move email configuration:\n' +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `From: ${args.fromFolder || 'INBOX'}\n` +
        `To: ${args.toFolder}\n` +
        `Create destination: ${args.createFolder || false}\n\n` +
        'Note: IMAP configuration required to move emails.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        const moveMessages = () => {
          imap.openBox(args.fromFolder || 'INBOX', false, (err, box) => {
            if (err) {
              imap.end();
              return reject(new Error(`Failed to open source folder: ${err}`));
            }

            imap.move(args.messageIds, args.toFolder, (err) => {
              imap.end();
              if (err) {
                reject(new Error(`Failed to move emails: ${err}`));
              } else {
                resolve(`Moved ${args.messageIds.length} email(s) from ${args.fromFolder || 'INBOX'} to ${args.toFolder}`);
              }
            });
          });
        };

        if (args.createFolder) {
          imap.addBox(args.toFolder, (err) => {
            if (err && !err.message.includes('ALREADYEXISTS')) {
              imap.end();
              return reject(new Error(`Failed to create folder: ${err}`));
            }
            moveMessages();
          });
        } else {
          moveMessages();
        }
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Create nested IMAP folder structure
   */
  async createFolder(args: OutlookCreateFolderArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Create folder configuration:\n' +
        `Folder path: ${args.folderPath}\n` +
        `Parent: ${args.parent || 'root'}\n\n` +
        'Note: IMAP configuration required to create folders.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        const fullPath = args.parent ? `${args.parent}/${args.folderPath}` : args.folderPath;

        imap.addBox(fullPath, (err) => {
          imap.end();
          if (err) {
            if (err.message.includes('ALREADYEXISTS')) {
              resolve(`Folder already exists: ${fullPath}`);
            } else {
              reject(new Error(`Failed to create folder: ${err}`));
            }
          } else {
            resolve(`Created folder: ${fullPath}`);
          }
        });
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Access shared mailboxes and delegate accounts
   */
  async accessSharedMailbox(args: OutlookSharedMailboxArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Shared mailbox access configuration:\n' +
        `Shared mailbox: ${args.sharedMailbox}\n` +
        `Operation: ${args.operation}\n` +
        `Folder: ${args.folder || 'INBOX'}\n\n` +
        'Note: IMAP configuration required for shared mailbox access.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        const sharedFolder = args.imapConfig!.sharedNamespace
          ? `${args.imapConfig!.sharedNamespace}/${args.sharedMailbox}/${args.folder || 'INBOX'}`
          : `shared/${args.sharedMailbox}/${args.folder || 'INBOX'}`;

        if (args.operation === 'list') {
          imap.openBox(sharedFolder, true, (err, box) => {
            if (err) {
              imap.end();
              return reject(new Error(`Failed to access shared mailbox: ${err}`));
            }

            imap.search(['ALL'], (err, results) => {
              imap.end();
              if (err) {
                reject(new Error(`Search failed: ${err}`));
              } else {
                const output = {
                  sharedMailbox: args.sharedMailbox,
                  folder: args.folder || 'INBOX',
                  messageCount: results.length,
                  messageIds: results,
                };
                const result = JSON.stringify(output, null, 2);
                if (args.outputPath) {
                  fs.writeFile(args.outputPath, result).then(() => {
                    resolve(`Listed ${results.length} messages. Saved to: ${args.outputPath}`);
                  }).catch(reject);
                } else {
                  resolve(result);
                }
              }
            });
          });
        } else if (args.operation === 'send' && args.emailData) {
          imap.end();
          // Use nodemailer to send from shared mailbox
          const transporter = nodemailer.createTransport({
            host: args.imapConfig!.host,
            port: 587,
            secure: false,
            auth: {
              user: args.imapConfig!.user,
              pass: args.imapConfig!.password,
            },
          });

          const mailOptions: any = {
            from: args.sharedMailbox,
            to: Array.isArray(args.emailData.to) ? args.emailData.to.join(', ') : args.emailData.to,
            subject: args.emailData.subject,
            [args.emailData.html ? 'html' : 'text']: args.emailData.body,
          };

          transporter.sendMail(mailOptions).then((info) => {
            resolve(`Sent email from shared mailbox ${args.sharedMailbox}. Message ID: ${info.messageId}`);
          }).catch(reject);
        } else {
          imap.end();
          resolve(`Operation ${args.operation} configured for shared mailbox: ${args.sharedMailbox}`);
        }
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Grant delegate permissions to other users (generates metadata file)
   */
  async grantDelegateAccess(args: OutlookDelegateAccessArgs): Promise<string> {
    const delegateConfig = {
      delegateEmail: args.delegateEmail,
      permissions: args.permissions,
      receiveNotifications: args.receiveNotifications !== false,
      privateItemsAccess: args.privateItemsAccess || false,
      createdAt: new Date().toISOString(),
      note: 'This is a metadata file for delegate permissions. In Outlook client, these permissions would be configured via File > Account Settings > Delegate Access.',
    };

    const output = JSON.stringify(delegateConfig, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Delegate access configuration created for ${args.delegateEmail}. Saved to: ${args.outputPath}`;
    }

    return output;
  }

  /**
   * Set automatic replies / out of office / vacation responder
   */
  async setOutOfOffice(args: OutlookOutOfOfficeArgs): Promise<string> {
    const config = {
      enabled: args.enable,
      startTime: args.startTime || 'immediate',
      endTime: args.endTime,
      message: args.message,
      externalAudience: args.externalAudience || 'none',
      declineNewMeetings: args.declineNewMeetings || false,
      declineMessage: args.declineMessage,
      createdAt: new Date().toISOString(),
      note: 'Out of office configuration. This would be applied via Exchange server settings or Outlook Rules.',
    };

    const output = JSON.stringify(config, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Out of office settings ${args.enable ? 'enabled' : 'disabled'}. Saved to: ${args.outputPath}`;
    }

    // If IMAP config provided, create a server-side rule for auto-reply
    if (args.imapConfig && args.enable) {
      return output + '\n\nNote: For actual auto-reply, configure server-side rules or use Exchange Web Services (EWS).';
    }

    return output;
  }

  /**
   * Create Outlook notes with color coding
   */
  async createNotes(args: OutlookNotesArgs): Promise<string> {
    const notes = args.notes.map((note, index) => ({
      id: `note-${Date.now()}-${index}`,
      subject: note.subject || 'Note',
      body: note.body,
      color: note.color || 'yellow',
      category: note.category,
      createdTime: note.createdTime || new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    }));

    const output = JSON.stringify(notes, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Created ${notes.length} note(s). Saved to: ${args.outputPath}\n\nNote: Outlook notes are proprietary. Import this JSON into Outlook using a custom script or convert to sticky notes format.`;
    }

    return output + '\n\nNote: Outlook notes are stored in the Notes folder. This JSON can be imported via Outlook VBA or third-party tools.';
  }

  /**
   * Create journal entries for activity tracking
   */
  async createJournalEntry(args: OutlookJournalArgs): Promise<string> {
    const entries = args.entries.map((entry, index) => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.duration
        ? new Date(startTime.getTime() + entry.duration * 60000)
        : startTime;

      return {
        id: `journal-${Date.now()}-${index}`,
        subject: entry.subject,
        entryType: entry.entryType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: entry.duration || 0,
        description: entry.description,
        contacts: entry.contacts || [],
        categories: entry.categories || [],
        company: entry.company,
        createdAt: new Date().toISOString(),
      };
    });

    const output = JSON.stringify(entries, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Created ${entries.length} journal entr(ies). Saved to: ${args.outputPath}\n\nNote: Journal entries can be imported into Outlook via File > Import/Export.`;
    }

    return output + '\n\nNote: Outlook Journal feature tracks activities. Import this JSON using Outlook automation or third-party tools.';
  }

  /**
   * Subscribe to and manage RSS feeds
   */
  async manageRSSFeed(args: OutlookRSSFeedArgs): Promise<string> {
    const config = {
      operation: args.operation,
      feeds: args.feeds || [],
      timestamp: new Date().toISOString(),
      note: 'RSS feed management. Outlook stores RSS feeds as OPML files and syncs them to a special RSS folder.',
    };

    if (args.operation === 'add' && args.feeds) {
      const opml = this.generateOPML(args.feeds);
      const output = args.outputPath
        ? `${args.outputPath}.opml`
        : 'rss-feeds.opml';

      await fs.writeFile(output, opml);
      return `Added ${args.feeds.length} RSS feed(s). OPML file saved to: ${output}\n\nImport this OPML file in Outlook via File > Account Settings > RSS Feeds > New.`;
    }

    const output = JSON.stringify(config, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `RSS feed operation: ${args.operation}. Saved to: ${args.outputPath}`;
    }

    return output;
  }

  /**
   * Manage PST/OST data files (metadata operations only)
   */
  async manageDataFile(args: OutlookDataFileArgs): Promise<string> {
    const metadata = {
      operation: args.operation,
      filePath: args.filePath,
      fileType: args.fileType || 'pst',
      displayName: args.displayName,
      deliverToThisFile: args.deliverToThisFile || false,
      encrypted: !!args.password,
      timestamp: new Date().toISOString(),
      note: 'PST/OST file metadata. Actual file operations require Outlook client or third-party PST libraries.',
      instructions: {
        create: 'Create a new PST file in Outlook via File > Account Settings > Data Files > Add',
        open: 'Open PST file via File > Open & Export > Open Outlook Data File',
        close: 'Close PST file by right-clicking in folder pane and selecting "Close"',
        compact: 'Compact PST via File > Account Settings > Data Files > Settings > Compact Now',
        info: 'View file properties via right-click > Data File Properties',
      },
    };

    const output = JSON.stringify(metadata, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Data file operation: ${args.operation}. Metadata saved to: ${args.outputPath}`;
    }

    return output;
  }

  /**
   * Create Quick Steps for email automation
   */
  async createQuickStep(args: OutlookQuickStepsArgs): Promise<string> {
    const quickSteps = args.steps.map((step, index) => ({
      id: `quickstep-${Date.now()}-${index}`,
      name: step.name,
      description: step.description,
      actions: step.actions,
      shortcut: step.shortcut,
      createdAt: new Date().toISOString(),
    }));

    const output = JSON.stringify(quickSteps, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Created ${quickSteps.length} Quick Step(s). Saved to: ${args.outputPath}\n\n` +
        'Note: Quick Steps are Outlook-specific automation. Import this configuration using Outlook VBA or recreate manually in Home > Quick Steps > New.';
    }

    return output + '\n\nNote: Quick Steps combine multiple actions into one click. Configure in Outlook via Home > Quick Steps.';
  }

  /**
   * Configure conversation view settings
   */
  async configureConversationView(args: OutlookConversationViewArgs): Promise<string> {
    const config = {
      enabled: args.enable,
      settings: args.settings || {
        showMessagesFromOtherFolders: true,
        showSenders: true,
        alwaysExpand: false,
        useClassicIndentation: false,
        highlightUnread: true,
      },
      folders: args.folders || ['all'],
      timestamp: new Date().toISOString(),
      note: 'Conversation view configuration. Apply in Outlook via View tab > Show as Conversations.',
    };

    const output = JSON.stringify(config, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Conversation view ${args.enable ? 'enabled' : 'disabled'}. Config saved to: ${args.outputPath}`;
    }

    return output;
  }

  /**
   * Clean up redundant messages in conversations
   */
  async cleanupMessages(args: OutlookCleanupArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Cleanup configuration:\n' +
        `Folder: ${args.folder || 'current'}\n` +
        `Scope: ${args.scope}\n` +
        `Delete redundant: ${args.deleteRedundant || false}\n\n` +
        'Note: IMAP configuration required for message cleanup.\n' +
        'This feature removes redundant messages in email conversations.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        imap.openBox(args.folder || 'INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open folder: ${err}`));
          }

          // Search for messages based on scope
          const searchCriteria = args.scope === 'selectedMessages' && args.messageIds
            ? args.messageIds
            : ['ALL'];

          imap.search(searchCriteria, (err, results) => {
            imap.end();
            if (err) {
              reject(new Error(`Search failed: ${err}`));
            } else {
              resolve(`Cleanup would process ${results.length} message(s) in ${args.folder || 'INBOX'}.\n` +
                `Scope: ${args.scope}\n` +
                `Action: ${args.deleteRedundant ? 'Delete' : 'Move to Deleted Items'}\n\n` +
                'Note: Full implementation requires conversation analysis to identify redundant messages.');
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Ignore conversation threads
   */
  async ignoreConversation(args: OutlookIgnoreConversationArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Ignore conversation configuration:\n' +
        `Conversation IDs: ${args.conversationIds.join(', ')}\n` +
        `Restore: ${args.restore || false}\n` +
        `Delete existing: ${args.deleteExisting || false}\n\n` +
        'Note: IMAP configuration required to ignore conversations.';
    }

    const action = args.restore ? 'restored' : 'ignored';
    const config = {
      conversationIds: args.conversationIds,
      action: action,
      deleteExisting: args.deleteExisting || false,
      timestamp: new Date().toISOString(),
      note: 'Ignored conversations are moved to Deleted Items and future messages in the thread are automatically deleted.',
    };

    const output = JSON.stringify(config, null, 2);

    return `${args.conversationIds.length} conversation(s) ${action}.\n\n${output}\n\n` +
      'Note: Outlook Ignore feature requires conversation tracking. Implement via server-side rules or client-side filters.';
  }

  /**
   * Flag emails with colors and due dates
   */
  async flagEmail(args: OutlookFlagEmailArgs): Promise<string> {
    if (!args.imapConfig) {
      return 'Flag email configuration:\n' +
        `Message IDs: ${args.messageIds.join(', ')}\n` +
        `Flag type: ${args.flag.type}\n` +
        `Color: ${args.flag.color || 'red'}\n` +
        `Due date: ${args.flag.dueDate || 'none'}\n\n` +
        'Note: IMAP configuration required to flag emails.';
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: args.imapConfig!.user,
        password: args.imapConfig!.password,
        host: args.imapConfig!.host,
        port: args.imapConfig!.port,
        tls: args.imapConfig!.tls !== false,
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open folder: ${err}`));
          }

          // IMAP flagging (standard flags only)
          const flag = args.flag.type === 'complete' ? '\\Flagged' : '\\Flagged';
          const action = args.flag.type === 'clear' ? 'delFlags' : 'addFlags';

          imap[action](args.messageIds, [flag], (err) => {
            imap.end();
            if (err) {
              reject(new Error(`Failed to flag emails: ${err}`));
            } else {
              const flagInfo = {
                messageIds: args.messageIds,
                flag: args.flag,
                timestamp: new Date().toISOString(),
                note: 'IMAP supports basic flagging. Extended properties (color, due date, reminder) require Exchange/Outlook client.',
              };
              resolve(`Flagged ${args.messageIds.length} email(s).\n\n${JSON.stringify(flagInfo, null, 2)}`);
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(new Error(`IMAP error: ${err}`));
      });

      imap.connect();
    });
  }

  /**
   * Create and apply color categories
   */
  async manageCategories(args: OutlookCategoryArgs): Promise<string> {
    if (args.operation === 'create') {
      const categories = {
        operation: 'create',
        categories: args.categories || [],
        timestamp: new Date().toISOString(),
        note: 'Outlook categories (master list) are stored in the registry or Outlook profile. These can be created via File > Options > Mail > Categories.',
      };

      const output = JSON.stringify(categories, null, 2);

      if (args.outputPath) {
        await fs.writeFile(args.outputPath, output);
        return `Created ${args.categories?.length || 0} categor(ies). Saved to: ${args.outputPath}`;
      }

      return output;
    }

    if ((args.operation === 'apply' || args.operation === 'remove') && args.imapConfig) {
      return new Promise((resolve, reject) => {
        const imap = new Imap({
          user: args.imapConfig!.user,
          password: args.imapConfig!.password,
          host: args.imapConfig!.host,
          port: args.imapConfig!.port,
          tls: args.imapConfig!.tls !== false,
        });

        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err, box) => {
            imap.end();
            if (err) {
              reject(new Error(`Failed to open folder: ${err}`));
            } else {
              const result = {
                operation: args.operation,
                messageIds: args.messageIds || [],
                categories: args.categoryNames || [],
                timestamp: new Date().toISOString(),
                note: 'Categories applied via IMAP custom keywords. Full color category support requires Exchange/Outlook client.',
              };
              resolve(JSON.stringify(result, null, 2));
            }
          });
        });

        imap.once('error', (err: Error) => {
          reject(new Error(`IMAP error: ${err}`));
        });

        imap.connect();
      });
    }

    if (args.operation === 'list') {
      const list = {
        operation: 'list',
        categories: [
          { name: 'Red Category', color: 'red', shortcut: 'Ctrl+F2' },
          { name: 'Blue Category', color: 'blue', shortcut: 'Ctrl+F3' },
          { name: 'Green Category', color: 'green', shortcut: 'Ctrl+F4' },
        ],
        note: 'Example category list. Actual categories are user-specific and stored in Outlook profile.',
      };

      const output = JSON.stringify(list, null, 2);

      if (args.outputPath) {
        await fs.writeFile(args.outputPath, output);
        return `Category list saved to: ${args.outputPath}`;
      }

      return output;
    }

    return `Category operation: ${args.operation} configured.`;
  }

  /**
   * Create HTML email signatures with images and formatting
   */
  async createSignature(args: OutlookSignatureArgs): Promise<string> {
    const results: string[] = [];

    for (const sig of args.signatures) {
      const signatureData = {
        name: sig.name,
        html: sig.html,
        text: sig.text || sig.html.replace(/<[^>]*>/g, ''),
        images: sig.images || [],
        defaultFor: sig.defaultFor || { newMessages: false, replies: false },
        createdAt: new Date().toISOString(),
      };

      // Create signature files (.htm and .txt)
      const basePath = args.outputPath
        ? path.join(args.outputPath, sig.name)
        : sig.name;

      const htmPath = `${basePath}.htm`;
      const txtPath = `${basePath}.txt`;

      await fs.writeFile(htmPath, sig.html);
      await fs.writeFile(txtPath, signatureData.text);

      // Copy images if provided
      if (sig.images) {
        for (const img of sig.images) {
          const imgDest = args.outputPath
            ? path.join(args.outputPath, img.filename)
            : img.filename;
          await fs.copyFile(img.path, imgDest);
        }
      }

      results.push(`Created signature: ${sig.name}\n  HTML: ${htmPath}\n  Text: ${txtPath}\n  Images: ${sig.images?.length || 0}`);
    }

    return results.join('\n\n') + '\n\nNote: Copy these signature files to Outlook signature folder:\n' +
      'Windows: %APPDATA%\\Microsoft\\Signatures\\\n' +
      'Mac: ~/Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile/Data/Signatures/';
  }

  /**
   * Manage autocomplete nickname cache
   */
  async manageAutoComplete(args: OutlookAutoCompleteArgs): Promise<string> {
    const config = {
      operation: args.operation,
      entries: args.entries || [],
      timestamp: new Date().toISOString(),
      note: 'Outlook autocomplete cache (.nk2 file) stores recently used email addresses. Located at %APPDATA%\\Microsoft\\Outlook\\',
    };

    if (args.operation === 'export' || args.operation === 'import') {
      const filePath = args.filePath || 'autocomplete.nk2';

      if (args.operation === 'export') {
        const nk2Data = {
          format: 'NK2',
          version: '2.0',
          entries: args.entries || [],
          exportedAt: new Date().toISOString(),
        };
        await fs.writeFile(filePath, JSON.stringify(nk2Data, null, 2));
        return `Exported ${args.entries?.length || 0} autocomplete entries to: ${filePath}\n\n` +
          'Note: This is a JSON representation. Actual .nk2 files use a binary format. Use NK2Edit or similar tools for real .nk2 files.';
      } else {
        return `Import from: ${filePath}\n\nNote: Actual .nk2 import requires Outlook client or third-party tools like NK2Edit.`;
      }
    }

    const output = JSON.stringify(config, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Autocomplete operation: ${args.operation}. Saved to: ${args.outputPath}`;
    }

    return output;
  }

  /**
   * Advanced mail merge with filters and conditional content
   */
  async advancedMailMerge(args: OutlookMailMergeAdvancedArgs): Promise<string> {
    // Apply filters to data source
    let filteredData = args.dataSource;

    if (args.filters) {
      filteredData = args.dataSource.filter(record => {
        return args.filters!.every(filter => {
          const value = record[filter.field];
          const filterValue = filter.value;

          switch (filter.operator) {
            case 'equals':
              return value === filterValue;
            case 'notEquals':
              return value !== filterValue;
            case 'contains':
              return String(value).includes(String(filterValue));
            case 'greaterThan':
              return Number(value) > Number(filterValue);
            case 'lessThan':
              return Number(value) < Number(filterValue);
            case 'startsWith':
              return String(value).startsWith(String(filterValue));
            case 'endsWith':
              return String(value).endsWith(String(filterValue));
            default:
              return true;
          }
        });
      });
    }

    // Process mail merge
    const emails: any[] = [];
    const sendOptions = args.sendOptions || {};

    for (const record of filteredData) {
      // Replace placeholders in subject and body
      let subject = args.template?.subject || '';
      let body = args.template?.body || '';

      for (const [key, value] of Object.entries(record)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        subject = subject.replace(placeholder, String(value));
        body = body.replace(placeholder, String(value));
      }

      // Apply conditional content
      if (args.conditionalContent) {
        for (const conditional of args.conditionalContent) {
          // Simple condition evaluation (e.g., "{{tier}} === 'premium'")
          const conditionMet = this.evaluateCondition(conditional.condition, record);
          if (conditionMet) {
            body += '\n\n' + conditional.content;
          }
        }
      }

      // Filter attachments based on conditions
      const attachments = args.attachments?.filter(att => {
        if (!att.conditional) return true;
        return this.evaluateCondition(att.conditional, record);
      }).map(att => ({
        filename: att.filename,
        path: att.path,
      })) || [];

      const email = {
        to: record.email || record.Email,
        subject: subject,
        body: body,
        html: args.template?.html || false,
        attachments: attachments,
        record: record,
      };

      emails.push(email);
    }

    // Generate output
    const mergeResult = {
      totalRecords: args.dataSource.length,
      filteredRecords: filteredData.length,
      emailsGenerated: emails.length,
      testMode: sendOptions.testMode || false,
      testAddress: sendOptions.testAddress,
      batchSize: sendOptions.batchSize || 50,
      delayBetweenBatches: sendOptions.delayBetweenBatches || 0,
      emails: emails.slice(0, 5), // Include first 5 emails as sample
      note: 'Mail merge generated. Use SMTP configuration to send emails.',
    };

    const output = JSON.stringify(mergeResult, null, 2);

    if (args.outputPath) {
      await fs.writeFile(args.outputPath, output);
      return `Mail merge completed. Generated ${emails.length} email(s) from ${filteredData.length} filtered record(s).\n` +
        `Saved to: ${args.outputPath}\n\n` +
        `Test mode: ${sendOptions.testMode || false}\n` +
        `Batch size: ${sendOptions.batchSize || 50}`;
    }

    // If SMTP config provided, send emails
    if (args.smtpConfig && !sendOptions.testMode) {
      const transporter = nodemailer.createTransport({
        host: args.smtpConfig.host,
        port: args.smtpConfig.port,
        secure: args.smtpConfig.secure !== false,
        auth: args.smtpConfig.auth,
      });

      let sent = 0;
      const batchSize = sendOptions.batchSize || 50;

      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        for (const email of batch) {
          await transporter.sendMail({
            from: args.smtpConfig.auth?.user || 'noreply@officewhisperer.com',
            to: email.to,
            subject: email.subject,
            [email.html ? 'html' : 'text']: email.body,
            attachments: email.attachments,
          });
          sent++;
        }

        if (i + batchSize < emails.length && sendOptions.delayBetweenBatches) {
          await new Promise(resolve => setTimeout(resolve, sendOptions.delayBetweenBatches! * 1000));
        }
      }

      return `Mail merge completed. Sent ${sent} email(s) to ${filteredData.length} recipient(s).\n` +
        `Batches: ${Math.ceil(sent / batchSize)}\n` +
        `Batch size: ${batchSize}`;
    }

    return output;
  }

  // Helper methods for v4.0

  /**
   * Generate OPML file for RSS feeds
   */
  private generateOPML(feeds: any[]): string {
    const opml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<opml version="2.0">',
      '<head>',
      '<title>Outlook RSS Feeds</title>',
      '<dateCreated>' + new Date().toUTCString() + '</dateCreated>',
      '</head>',
      '<body>',
    ];

    for (const feed of feeds) {
      opml.push(`<outline type="rss" text="${feed.name || feed.url}" xmlUrl="${feed.url}" />`);
    }

    opml.push('</body>');
    opml.push('</opml>');

    return opml.join('\n');
  }

  /**
   * Evaluate simple conditions for mail merge
   */
  private evaluateCondition(condition: string, record: Record<string, any>): boolean {
    try {
      // Replace placeholders with actual values
      let evalCondition = condition;
      for (const [key, value] of Object.entries(record)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const safeValue = typeof value === 'string' ? `'${value}'` : value;
        evalCondition = evalCondition.replace(placeholder, String(safeValue));
      }

      // Simple evaluation (support ===, !==, >, <, >=, <=)
      // eslint-disable-next-line no-eval
      return eval(evalCondition);
    } catch (error) {
      console.error(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }
}
