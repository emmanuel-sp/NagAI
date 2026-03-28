import grpc
import os
import logging
from concurrent import futures
from dotenv import load_dotenv

# Load .env before importing ai_handlers (which reads ANTHROPIC_API_KEY on import)
load_dotenv()

from logging_config import setup_logging, correlation_id_var

setup_logging()
logger = logging.getLogger(__name__)

import ai_service_pb2
import ai_service_pb2_grpc
import ai_handlers
import chat_handler
from grpc_health.v1 import health, health_pb2, health_pb2_grpc


class CorrelationIdInterceptor(grpc.ServerInterceptor):
    """Extracts X-Correlation-ID from gRPC metadata into contextvars."""

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)
        cid = metadata.get("x-correlation-id", "-")
        correlation_id_var.set(cid)
        return continuation(handler_call_details)


class AiServiceServicer(ai_service_pb2_grpc.AiServiceServicer):

    def SuggestSmartField(self, request, context):
        try:
            suggestion = ai_handlers.suggest_smart_field(
                request.field, request.goal_title, request.goal_description,
                dict(request.existing_fields),
                request.user_profile,
                request.steps_taken,
                request.target_date,
            )
            return ai_service_pb2.SmartFieldResponse(suggestion=suggestion)
        except Exception as e:
            logger.error(f"SuggestSmartField error: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal service error")
            return ai_service_pb2.SmartFieldResponse()

    def GenerateChecklistItem(self, request, context):
        try:
            item = ai_handlers.generate_checklist_item(
                request.goal_title,
                request.goal_description,
                list(request.existing_items),
                request.user_profile,
                list(request.completed_items),
                request.goal_smart_context,
            )
            return ai_service_pb2.ChecklistItemResponse(
                title=item["title"],
                notes=item["notes"],
                deadline=item["deadline"],
            )
        except Exception as e:
            logger.error(f"GenerateChecklistItem error: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal service error")
            return ai_service_pb2.ChecklistItemResponse()

    def GenerateFullChecklist(self, request, context):
        try:
            items = ai_handlers.generate_full_checklist(
                request.goal_title,
                request.goal_description,
                request.user_profile,
                list(request.completed_items),
                request.goal_smart_context,
            )
            pb_items = [
                ai_service_pb2.ChecklistItem(
                    title=i["title"], notes=i["notes"], deadline=i["deadline"]
                )
                for i in items
            ]
            return ai_service_pb2.FullChecklistResponse(items=pb_items)
        except Exception as e:
            logger.error(f"GenerateFullChecklist error: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal service error")
            return ai_service_pb2.FullChecklistResponse()

    def GenerateDailyChecklist(self, request, context):
        try:
            candidates = [
                {
                    "label": c.label,
                    "title": c.title,
                    "notes": c.notes,
                    "completed": c.completed,
                    "goal_title": c.goal_title,
                    "goal_smart_context": c.goal_smart_context,
                }
                for c in request.candidates
            ]
            items = ai_handlers.generate_daily_checklist(
                candidates,
                list(request.recurring_items),
                request.max_items,
                request.current_time,
                request.user_profile,
                request.day_of_week,
                request.plan_date,
            )
            pb_items = [
                ai_service_pb2.DailyChecklistItemSuggestion(
                    label=i["label"],
                    title=i["title"],
                    notes=i.get("notes", ""),
                    scheduled_time=i.get("scheduled_time", ""),
                )
                for i in items
            ]
            return ai_service_pb2.DailyChecklistResponse(items=pb_items)
        except Exception as e:
            logger.error(f"GenerateDailyChecklist error: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal service error")
            return ai_service_pb2.DailyChecklistResponse()

    def AgentChat(self, request, context):
        try:
            goals = [
                {
                    "title": g.title,
                    "description": g.description,
                    "smart_context": g.smart_context,
                    "completed_items": g.completed_items,
                    "total_items": g.total_items,
                    "active_items": list(g.active_items),
                }
                for g in request.goals
            ]
            history = [
                {"role": e.role, "content": e.content}
                for e in request.history
            ]
            response_text = chat_handler.handle_chat(
                request.user_message,
                request.user_profile,
                goals,
                history,
                request.from_context_summary,
            )
            return ai_service_pb2.AgentChatResponse(assistant_message=response_text)
        except Exception as e:
            logger.error(f"AgentChat error: {e}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("Internal service error")
            return ai_service_pb2.AgentChatResponse()


def serve():
    port = os.environ.get("GRPC_PORT", "9090")
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=4),
        interceptors=[CorrelationIdInterceptor()],
    )
    ai_service_pb2_grpc.add_AiServiceServicer_to_server(AiServiceServicer(), server)

    # gRPC health check service
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("nagai.ai.AiService", health_pb2.HealthCheckResponse.SERVING)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"NagAI gRPC server listening on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
