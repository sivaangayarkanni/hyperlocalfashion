#!/usr/bin/env node

/**
 * ReWear Analytics MCP Server
 * Provides platform analytics, user statistics, and reporting capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../rewear.db');
const db = new sqlite3.Database(dbPath);

// Initialize MCP Server
const server = new Server(
  {
    name: 'rewear-analytics',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_stats',
        description: 'Get comprehensive statistics for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
              description: 'User ID',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_platform_metrics',
        description: 'Get overall platform metrics and KPIs',
        inputSchema: {
          type: 'object',
          properties: {
            timeRange: {
              type: 'string',
              enum: ['day', 'week', 'month', 'year', 'all'],
              description: 'Time range for metrics',
            },
          },
        },
      },
      {
        name: 'generate_report',
        description: 'Generate detailed analytics report',
        inputSchema: {
          type: 'object',
          properties: {
            reportType: {
              type: 'string',
              enum: ['sustainability', 'revenue', 'user_engagement', 'tailor_performance'],
              description: 'Type of report to generate',
            },
            format: {
              type: 'string',
              enum: ['json', 'summary'],
              description: 'Report format',
            },
          },
          required: ['reportType'],
        },
      },
      {
        name: 'get_tailor_analytics',
        description: 'Get analytics for a specific tailor',
        inputSchema: {
          type: 'object',
          properties: {
            tailorId: {
              type: 'number',
              description: 'Tailor ID',
            },
          },
          required: ['tailorId'],
        },
      },
    ],
  };
});

// Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_stats': {
        const { userId } = args;

        const stats = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
              u.id, u.name, u.email,
              u.totalRepairs, u.totalCO2Saved, u.totalWaterSaved,
              u.totalPoints, u.trustScore,
              COUNT(DISTINCT b.id) as totalBookings,
              COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completedBookings,
              AVG(CASE WHEN b.status = 'completed' THEN b.price END) as avgBookingValue
            FROM users u
            LEFT JOIN bookings b ON u.id = b.userId
            WHERE u.id = ?
            GROUP BY u.id`,
            [userId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row || {});
            }
          );
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                userId,
                stats,
                insights: {
                  engagementLevel: stats.totalBookings > 10 ? 'high' : stats.totalBookings > 5 ? 'medium' : 'low',
                  sustainabilityRank: stats.totalCO2Saved > 50 ? 'top' : stats.totalCO2Saved > 20 ? 'medium' : 'beginner',
                  trustLevel: stats.trustScore > 80 ? 'excellent' : stats.trustScore > 60 ? 'good' : 'building',
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'get_platform_metrics': {
        const { timeRange = 'all' } = args;

        const timeFilters = {
          day: "datetime('now', '-1 day')",
          week: "datetime('now', '-7 days')",
          month: "datetime('now', '-1 month')",
          year: "datetime('now', '-1 year')",
          all: "datetime('2000-01-01')",
        };

        const metrics = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
              COUNT(DISTINCT u.id) as totalUsers,
              COUNT(DISTINCT t.id) as totalTailors,
              COUNT(DISTINCT b.id) as totalBookings,
              COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completedBookings,
              SUM(CASE WHEN b.status = 'completed' THEN b.price ELSE 0 END) as totalRevenue,
              SUM(u.totalCO2Saved) as totalCO2Saved,
              SUM(u.totalWaterSaved) as totalWaterSaved,
              AVG(t.rating) as avgTailorRating,
              AVG(u.trustScore) as avgUserTrustScore
            FROM users u
            LEFT JOIN bookings b ON u.id = b.userId AND b.createdAt > ${timeFilters[timeRange]}
            LEFT JOIN tailors t ON 1=1`,
            (err, row) => {
              if (err) reject(err);
              else resolve(row || {});
            }
          );
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                timeRange,
                metrics,
                kpis: {
                  completionRate: ((metrics.completedBookings / metrics.totalBookings) * 100).toFixed(2) + '%',
                  avgRevenuePerBooking: (metrics.totalRevenue / metrics.completedBookings).toFixed(2),
                  sustainabilityImpact: {
                    co2: metrics.totalCO2Saved + ' kg',
                    water: metrics.totalWaterSaved + ' L',
                  },
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'generate_report': {
        const { reportType, format = 'json' } = args;

        let reportData = {};

        switch (reportType) {
          case 'sustainability':
            reportData = await new Promise((resolve, reject) => {
              db.all(
                `SELECT 
                  u.id, u.name,
                  u.totalCO2Saved, u.totalWaterSaved, u.totalRepairs,
                  u.totalPoints
                FROM users u
                ORDER BY u.totalCO2Saved DESC
                LIMIT 10`,
                (err, rows) => {
                  if (err) reject(err);
                  else resolve({
                    title: 'Top Sustainability Champions',
                    topUsers: rows,
                    summary: `${rows.length} users leading the sustainability movement`,
                  });
                }
              );
            });
            break;

          case 'revenue':
            reportData = await new Promise((resolve, reject) => {
              db.get(
                `SELECT 
                  COUNT(*) as totalBookings,
                  SUM(price) as totalRevenue,
                  AVG(price) as avgBookingValue,
                  SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as completedRevenue
                FROM bookings`,
                (err, row) => {
                  if (err) reject(err);
                  else resolve({
                    title: 'Revenue Report',
                    metrics: row,
                    summary: `Total revenue: ₹${row.totalRevenue}`,
                  });
                }
              );
            });
            break;

          case 'user_engagement':
            reportData = await new Promise((resolve, reject) => {
              db.all(
                `SELECT 
                  u.id, u.name, u.email,
                  COUNT(b.id) as bookingCount,
                  MAX(b.createdAt) as lastBooking
                FROM users u
                LEFT JOIN bookings b ON u.id = b.userId
                GROUP BY u.id
                ORDER BY bookingCount DESC
                LIMIT 20`,
                (err, rows) => {
                  if (err) reject(err);
                  else resolve({
                    title: 'User Engagement Report',
                    topUsers: rows,
                    summary: `${rows.length} most engaged users`,
                  });
                }
              );
            });
            break;

          case 'tailor_performance':
            reportData = await new Promise((resolve, reject) => {
              db.all(
                `SELECT 
                  t.id, t.name, t.rating, t.trustScore,
                  COUNT(b.id) as totalBookings,
                  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completedBookings
                FROM tailors t
                LEFT JOIN bookings b ON t.id = b.tailorId
                GROUP BY t.id
                ORDER BY t.rating DESC
                LIMIT 10`,
                (err, rows) => {
                  if (err) reject(err);
                  else resolve({
                    title: 'Top Performing Tailors',
                    topTailors: rows,
                    summary: `${rows.length} highest rated tailors`,
                  });
                }
              );
            });
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: format === 'summary' 
                ? reportData.summary 
                : JSON.stringify(reportData, null, 2),
            },
          ],
        };
      }

      case 'get_tailor_analytics': {
        const { tailorId } = args;

        const analytics = await new Promise((resolve, reject) => {
          db.get(
            `SELECT 
              t.id, t.name, t.rating, t.trustScore,
              COUNT(b.id) as totalBookings,
              COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completedBookings,
              AVG(CASE WHEN b.status = 'completed' THEN b.price END) as avgBookingValue,
              SUM(CASE WHEN b.status = 'completed' THEN b.price ELSE 0 END) as totalRevenue
            FROM tailors t
            LEFT JOIN bookings b ON t.id = b.tailorId
            WHERE t.id = ?
            GROUP BY t.id`,
            [tailorId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row || {});
            }
          );
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tailorId,
                analytics,
                performance: {
                  completionRate: ((analytics.completedBookings / analytics.totalBookings) * 100).toFixed(2) + '%',
                  ratingLevel: analytics.rating > 4.5 ? 'excellent' : analytics.rating > 4.0 ? 'good' : 'average',
                  revenuePerBooking: (analytics.totalRevenue / analytics.completedBookings).toFixed(2),
                },
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ReWear Analytics MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
