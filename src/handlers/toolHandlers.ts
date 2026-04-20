import { TrelloApi } from "../api/trelloApi";

export function createToolHandlers(trello: TrelloApi) {
  return {
    async handleListBoards() {
      try {
        const boards = await trello.get("/members/me/boards", {
          fields: "id,name,closed",
        });
        const openBoards = boards.filter((board: any) => !board.closed);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                openBoards.map((board: any) => ({
                  id: board.id,
                  name: board.name,
                  description: `Trello board: ${board.name}`,
                })),
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleReadBoard(args: any) {
      try {
        console.error("handleReadBoard args:", args);
        const { boardId } = args;
        if (!args || typeof args !== "object" || !args.boardId)
          throw new Error("boardId is required");
        const boardData = await trello.get(`/boards/${boardId}`, {
          fields: "id,name,closed",
        });
        if (boardData.closed) throw new Error("Board is closed");
        const lists = await trello.get(`/boards/${boardId}/lists`, {
          fields: "id,name,closed",
        });
        const openLists = lists.filter((list: any) => !list.closed);
        const listWithCards = await Promise.all(
          openLists.map(async (list: any) => {
            const cards = await trello.get(`/lists/${list.id}/cards`, {
              fields: "id,name,closed",
            });
            const openCards = cards.filter((card: any) => !card.closed);
            return {
              listId: list.id,
              listName: list.name,
              cards: openCards.map((card: any) => ({
                id: card.id,
                name: card.name,
                description: `Trello card: ${card.name} in list ${list.name}`,
              })),
            };
          })
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  boardId: boardData.id,
                  boardName: boardData.name,
                  lists: listWithCards,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleCreateList(args: any) {
      try {
        const { boardId, name } = args;
        if (!boardId || !name) throw new Error("boardId and name are required");
        const list = await trello.createList(boardId as string, name as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: list.id,
                  name: list.name,
                  boardId: list.idBoard,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleCreateCard(args: any) {
      try {
        const { listId, name, desc = "" } = args;
        if (!listId || !name) throw new Error("listId and name are required");
        const card = await trello.post("/cards", {
          idList: listId,
          name,
          desc,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: card.id,
                  url: card.url,
                  name: card.name,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleMoveCard(args: any) {
      try {
        const { cardId, listId } = args;
        if (!cardId || !listId)
          throw new Error("cardId and listId are required");
        await trello.put(`/cards/${cardId}`, { idList: listId });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ moved: true, cardId, listId }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleAddComment(args: any) {
      try {
        const { cardId, text } = args;
        if (!cardId || !text) throw new Error("cardId and text are required");
        const comment = await trello.post(`/cards/${cardId}/actions/comments`, {
          text,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  commentId: comment.id,
                  text: comment.data.text,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleArchiveCard(args: any) {
      try {
        const { cardId } = args;
        if (!cardId) throw new Error("cardId is required");
        await trello.put(`/cards/${cardId}`, { closed: true });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  archived: true,
                  cardId,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleArchiveList(args: any) {
      try {
        const { listId } = args;
        if (!listId) throw new Error("listId is required");

        await trello.put(`/lists/${listId}`, {
          closed: true,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  archived: true,
                  listId,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleDeleteBoard(args: any) {
      try {
        const { boardId } = args;
        if (!boardId) throw new Error("boardId is required");
        await trello.delete(`/boards/${boardId}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  boardId,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleUpdateListName(args: any) {
      try {
        const { listId, name } = args;
        if (!listId || !name) throw new Error("listId and name is required");

        await trello.put(`/lists/${listId}`, { name });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  listId,
                  name,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleUpdateCardName(args: any) {
      try {
        const { cardId, name } = args;
        if (!cardId || !name) throw new Error("cardId and name required");

        await trello.put(`/cards/${cardId}`, { name });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  cardId,
                  name,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleUpdateCardDescription(args: any) {
      try {
        const { cardId, desc } = args;
        if (!cardId || typeof desc !== "string")
          throw new Error("cardId and desc required");
        await trello.put(`/cards/${cardId}`, { desc });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ cardId, updated: true }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleSetCardDueDate(args: any) {
      try {
        const { cardId, due } = args;
        if (!cardId) throw new Error("cardId is required");
        await trello.put(`/cards/${cardId}`, { due: due ?? "" });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ cardId, due: due ?? null }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleListBoardMembers(args: any) {
      try {
        const { boardId } = args;
        if (!boardId) throw new Error("boardId is required");
        const members = await trello.get(`/boards/${boardId}/members`, {
          fields: "id,fullName,username",
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                members.map((m: any) => ({
                  id: m.id,
                  fullName: m.fullName,
                  username: m.username,
                })),
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleAssignCardMember(args: any) {
      try {
        const { cardId, memberId } = args;
        if (!cardId || !memberId)
          throw new Error("cardId and memberId required");
        const members = await trello.post(`/cards/${cardId}/idMembers`, {
          value: memberId,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  cardId,
                  assigned: memberId,
                  currentMembers: members.map((m: any) => ({
                    id: m.id,
                    username: m.username,
                    fullName: m.fullName,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleUnassignCardMember(args: any) {
      try {
        const { cardId, memberId } = args;
        if (!cardId || !memberId)
          throw new Error("cardId and memberId required");
        const members = await trello.delete(
          `/cards/${cardId}/idMembers/${memberId}`
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  cardId,
                  removed: memberId,
                  currentMembers: (members || []).map((m: any) => ({
                    id: m.id,
                    username: m.username,
                    fullName: m.fullName,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleListBoardLabels(args: any) {
      try {
        const { boardId } = args;
        if (!boardId) throw new Error("boardId is required");
        const labels = await trello.get(`/boards/${boardId}/labels`, {
          fields: "id,name,color",
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(labels, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleAddCardLabel(args: any) {
      try {
        const { cardId, labelId } = args;
        if (!cardId || !labelId)
          throw new Error("cardId and labelId required");
        await trello.post(`/cards/${cardId}/idLabels`, { value: labelId });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ cardId, added: labelId }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
    async handleRemoveCardLabel(args: any) {
      try {
        const { cardId, labelId } = args;
        if (!cardId || !labelId)
          throw new Error("cardId and labelId required");
        await trello.delete(`/cards/${cardId}/idLabels/${labelId}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ cardId, removed: labelId }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
