import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

from a2a.helpers import (
    get_message_text,
    new_task_from_user_message,
    new_text_message,
    new_text_part,
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types.a2a_pb2 import TaskState

load_dotenv()


class GreenPTAgent:
    """LLM Agent powered by GreenPT (gemma4)."""

    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=os.getenv('GREENPT_API_KEY'),
            base_url='https://api.greenpt.ai/v1',
        )

    async def invoke(self, user_request: str) -> str:
        """Send user request to the GreenPT LLM and return the response."""
        response = await self.client.chat.completions.create(
            model='gemma4',
            messages=[{'role': 'user', 'content': user_request}],
        )
        return response.choices[0].message.content


# --8<-- [start:HelloWorldAgentExecutor_init]
class HelloWorldAgentExecutor(AgentExecutor):
    """AgentExecutor powered by GreenPT LLM."""

    def __init__(self) -> None:
        self.agent = GreenPTAgent()

    # --8<-- [end:HelloWorldAgentExecutor_init]

    # --8<-- [start:HelloWorldAgentExecutor_execute]
    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """Process user request."""
        # 1. Collect a task from request context
        if context.current_task:
            task = context.current_task
        else:
            # 1.1 If there is no task, create one and add it event queue
            task = new_task_from_user_message(context.message)
            await event_queue.enqueue_event(task)

        # 2. Update task status in EventQueue using TaskUpdater class object
        task_updater = TaskUpdater(
            event_queue=event_queue, task_id=task.id, context_id=task.context_id
        )
        await task_updater.update_status(
            state=TaskState.TASK_STATE_WORKING,
            message=new_text_message('Processing request...'),
        )

        # 3. Collect user request from request content and invoke LLM agent to generate content
        query = get_message_text(context.message)
        if query:
            result = await self.agent.invoke(user_request=query)
        else:
            result = 'No text input is provided!'

        # 4. Add generated response as an artifact to EventQueue
        await task_updater.add_artifact(parts=[new_text_part(text=result, media_type='text/plain')])
        print('Result: ', result)

        # 5. Update task status to completed
        await task_updater.update_status(
            state=TaskState.TASK_STATE_COMPLETED,
            message=new_text_message('Request is completed!'),
        )

    # --8<-- [end:HelloWorldAgentExecutor_execute]

    # --8<-- [start:HelloWorldAgentExecutor_cancel]
    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        """Raise exception as cancel is not supported."""
        raise NotImplementedError('Cancel is not supported.')

    # --8<-- [end:HelloWorldAgentExecutor_cancel]
