import grpc
import os
import logging
from concurrent import futures
from dotenv import load_dotenv

# Load .env before importing ai_handlers (which reads ANTHROPIC_API_KEY on import)
load_dotenv()

import ai_service_pb2
import ai_service_pb2_grpc
import ai_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AiServiceServicer(ai_service_pb2_grpc.AiServiceServicer):

    def SuggestSmartField(self, request, context):
        try:
            suggestion = ai_handlers.suggest_smart_field(
                request.field, request.goal_title, request.goal_description,
                dict(request.existing_fields),
                request.user_profile,
            )
            return ai_service_pb2.SmartFieldResponse(suggestion=suggestion)
        except Exception as e:
            logger.error(f"SuggestSmartField error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
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
            logger.error(f"GenerateChecklistItem error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
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
            logger.error(f"GenerateFullChecklist error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ai_service_pb2.FullChecklistResponse()


def serve():
    port = os.environ.get("GRPC_PORT", "9090")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    ai_service_pb2_grpc.add_AiServiceServicer_to_server(AiServiceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"NagAI gRPC server listening on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
