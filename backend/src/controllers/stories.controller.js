export function storyController(service) {
  return {
    publish: async (req, res) => {
      const result = await service.publish(req.body, req.file);
      res.status(result.created ? 201 : 200).json({
        story: result.story,
        deleteToken: result.deleteToken,
      });
    },
    list: async (req, res) => {
      const stories = await service.list(req.query.limit);
      res.json({ stories });
    },
    withdraw: async (req, res) => {
      const removed = await service.withdraw(req.params.id, req.get('x-delete-token'));
      if (!removed) return res.status(404).json({ error: 'Story not found.' });
      return res.status(204).end();
    },
  };
}
