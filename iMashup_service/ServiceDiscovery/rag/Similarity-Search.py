import pandas as pd
import numpy as np
import faiss
import pickle
from sentence_transformers import SentenceTransformer

# javaHttp对接
from flask import Flask, request, jsonify

# 用户请求相似度检索
def search_similar_services(query: str,model_path: str,index_path: str, meta_path: str,top_k):
    # 加载FAISS索引
    index = faiss.read_index(index_path)

    # 加载元数据
    with open(meta_path, "rb") as f:
        meta = pickle.load(f)
    model = SentenceTransformer(model_path)

    # 用户请求向量化
    query_emb = model.encode([query])
    query_emb = np.array(query_emb).astype("float32")
    faiss.normalize_L2(query_emb)

    # FAISS 相似度搜索
    D, I = index.search(query_emb, top_k)
    results = []
    for score, idx in zip(D[0], I[0]):
        service = meta[idx]
        if isinstance(service, pd.Series):
            service = service.to_dict()
        # row = {"score": float(score)}
        # row.update(service)
        row = {
            "score": float(score),
            "API链接":service.get("API\链\接", "") or service.get("API链接", "")
        }
        results.append(row)
    return results


app = Flask(__name__)
@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    if not data or"query" not in data:
        return jsonify({"code":400, "msg":"缺少query参数！"}), 400
    user_query = data["query"]
    model_path = "D:/mjh/EasyComposer/data/models--sentence-transformers--all-MiniLM-L6-v2/snapshots\c9745ed1d9f207416be6d2e6f8de32d1f16199bf"  # 模型路径
    index_path = "D:/mjh/EasyComposer/data/ServiceDiscovery/data/Local_library/Amerged_detail_NL.index"#FAISS索引路径
    meta_path = "D:/mjh/EasyComposer/data/ServiceDiscovery/data/Local_library/Amerged_detail_meta_NL.pkl"#元数据路径
    top_k = 1
    top_results = search_similar_services(
        query=user_query,
        model_path=model_path,
        index_path=index_path,
        meta_path = meta_path,
        top_k = top_k
    )
    df = pd.DataFrame(top_results)
    print(f"已保存 {len(df)}")

    return jsonify({
        "code": 200,
        "msg": "success",
        "data": top_results
    })

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

# # 主函数
# if __name__ == "__main__":
#     # 用户请求查询
#     user_query = "web data if known phone, fax, email"#用户输入请求
#     model_path = "D:/cache/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf"#模型路径
#     index_path = "D:/liwen/Documents/Python/LangChain-LLM/data/Local_library/Business_NL.index"#FAISS索引路径
#     meta_path = "D:/liwen/Documents/Python/LangChain-LLM/data/Local_library/Business_meta_NL.pkl"#元数据路径
#     top_k = 1000#返回数据条目
#     top_results = search_similar_services(
#         query=user_query,
#         model_path=model_path,
#         index_path=index_path,
#         meta_path = meta_path,
#         top_k = top_k
#     )
#     output_csv_path = r"D:/liwen/Documents/Python/LangChain-LLM/data/CandidateList/Business.csv"#输出路径
#     df = pd.DataFrame(top_results)
#     df.to_csv(output_csv_path, index=False, encoding="utf-8-sig")#写入output文件
#     print(f"已保存 {len(df)} 条相似服务到：{output_csv_path}")
