# Database Module

## Description

Global database module providing Prisma ORM access to all other modules. Handles SQLite database connection and lifecycle.

## Contents

- `database.module.ts` - Global module definition
- `prisma.service.ts` - Prisma client wrapper with lifecycle hooks

## Key Concepts

- **Global Module**: Imported once in AppModule, available everywhere
- **PrismaService**: Extends PrismaClient with NestJS lifecycle integration
- **Connection Management**: Handles connect/disconnect on app start/stop
- **SQLite**: Default database stored in `~/.local-mcp-gateway-data/`

## Usage

```typescript
@Injectable()
export class MyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.myModel.findMany();
  }
}
```
