import { Router } from 'express';
import { config } from '../config/index.js';
import { getAllCapabilities } from '../capabilities/registry.js';

const router = Router();

router.get('/.well-known/agent.json', (_req, res) => {
  const capabilities = getAllCapabilities().map((cap) => ({
    id: cap.id,
    description: cap.description,
  }));

  res.json({
    name: config.agentCard.name,
    description: config.agentCard.description,
    url: config.agentCard.url,
    protocol: config.agentCard.protocol,
    capabilities,
  });
});

export default router;
