# Pinging

![Pinging Logo](public/main-logo.svg)

Pinging is a comprehensive monitoring tool designed to help you track and supervise various types of endpoints including websites, TCP sockets, DNS records, and more. With real-time alerts and detailed analytics, Pinging makes sure you're always informed about the status of your critical services.

## Features

- **Multi-protocol Monitoring**: Monitor HTTP/HTTPS websites, TCP sockets, DNS records, and more
- **Real-time Alerts**: Get instant notifications when your services experience downtime
- **Detailed Analytics**: View performance metrics and uptime statistics
- **Customizable Checks**: Configure monitoring intervals, timeout thresholds, and alert conditions
- **Dashboard Overview**: Monitor all your services from a single, intuitive dashboard
- **Historical Data**: Track performance history to identify patterns and trends

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/xig0n/pinging.git
cd pinging
```

2. Install dependencies
```bash
pnpm install
```

3. Start the development server
```bash
pnpm dev
```

4. Build for production
```bash
pnpm build
pnpm start
```

## Usage

### Adding a Monitor

1. Navigate to the dashboard
2. Click on "Add Monitor"
3. Select monitor type (Website, TCP Socket, DNS)
4. Configure monitor settings (URL/IP, port, check interval, etc.)
5. Save your monitor

### Monitor Types

#### Website Monitor
Track HTTP/HTTPS endpoints with configurable status codes, content validation, and SSL certificate checks.

#### TCP Socket Monitor
Verify that TCP services like databases, mail servers, or custom applications are responding correctly.

#### DNS Monitor
Monitor DNS records to ensure your domain's DNS configuration is correct and accessible.

## Configuration

Pinging can be configured through the user interface or by directly editing configuration files in the `data` directory.

## Project Structure

```
pinging/
├── api/        # Backend API endpoints
├── app/        # Next.js application
├── components/ # React components
├── data/       # Data storage
├── hooks/      # Custom React hooks
├── lib/        # Utility functions
└── public/     # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any problems or have any questions, please open an issue in the GitHub repository. 