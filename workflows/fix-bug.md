<purpose>
Dieu phoi 5 agents dieu tra va sua loi theo phuong phap khoa hoc: thu thap trieu chung (Janitor) -> phan tich code + tai lieu (Detective + DocSpec) -> tao test tai hien (Repro) -> tong hop va ra phan quyet (Architect) -> sua code va commit (Orchestrator truc tiep).
Luu trang thai dieu tra (.planning/debug/) de tiep tuc khi hoi thoai bi mat. Lap den khi user xac nhan.
</purpose>

<required_reading>
Doc truoc khi bat dau:
- @references/conventions.md -> version matching, patch version, bieu tuong, commit prefixes
</required_reading>

<conditional_reading>
Doc CHI KHI can:
- @references/prioritization.md -> phan loai rui ro bug -- KHI nhieu bugs can uu tien
</conditional_reading>

<process>

## Buoc 0: Resume UI

`git rev-parse --git-dir 2>/dev/null` -> luu `HAS_GIT`
`mkdir -p .planning/debug`

1. Glob `.planning/debug/S*` -> lay danh sach folder names
2. Voi moi folder, Read `{folder}/SESSION.md` -> lay content
3. Goi `listSessions(folderNames, sessionContents)` tu `bin/lib/session-manager.js`
   - folderNames: mang ten folders (VD: `['S001-login-timeout', 'S002-cart-empty']`)
   - sessionContents: mang `[{folderName, sessionMdContent}]`
   - Tra ve danh sach sessions chua resolved, gom { number, id, slug, status, outcome, updated }
4. Neu co sessions active/paused:
   Hien bang:
   ```
   Phien dieu tra dang mo:
   | # | ID   | Mo ta            | Trang thai |
   |---|------|------------------|------------|
   | 1 | S001 | login-timeout    | active     |
   | 2 | S003 | cart-empty       | paused     |
   ```
   Hoi: "Nhap so de tiep tuc, hoac mo ta loi moi de tao phien."
5. User nhap so -> doc SESSION.md cua phien do -> xac dinh buoc tiep theo tu status:
   - status=active -> Buoc 1 (tiep tuc voi session hien tai, truyen session_dir)
   - status=paused -> doc evidence files da co -> nhay buoc phu hop
6. User nhap mo ta moi -> Buoc 0.5
7. Khong co sessions nao VA co $ARGUMENTS -> Buoc 0.5
8. Khong co sessions nao VA khong co $ARGUMENTS -> hoi user mo ta loi -> Buoc 0.5

## Buoc 0.5: Phan tich bug -- quyet dinh tai lieu tham khao

- Nhieu bugs can uu tien? -> doc @references/prioritization.md
Neu chi co 1 bug -> BO QUA.

### Tao session moi (per D-09)

Goi `createSession({ existingSessions, description })` tu `bin/lib/session-manager.js`
- existingSessions: danh sach sessions tu Buoc 0 (mang { number })
- description: mo ta loi tu user ($ARGUMENTS hoac input)
- Ket qua: { id, slug, folderName, sessionMd }
- `mkdir -p .planning/debug/{folderName}`
- Ghi sessionMd vao `.planning/debug/{folderName}/SESSION.md`
- Luu `session_dir` = duong dan tuyet doi toi `.planning/debug/{folderName}` de truyen cho cac buoc sau

</process>

<rules>
- Tuan thu `.planning/rules/` (general + stack-specific)
- CAM doc/hien thi file nhay cam (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- KHONG tu dong loi — PHAI cho user xac nhan
- KHONG gioi han lan sua — lap den khi xac nhan
- Moi lan sua: commit rieng fix([LOI])
- FastCode loi -> Grep/Read, KHONG DUNG
- Tiep tuc phien -> doc SESSION TRUOC, khong bat dau lai
- Chi hien banner va ket qua cuoi. KHONG hien chi tiet agent output cho user.
</rules>

<success_criteria>
- [ ] Trieu chung du 5 thong tin
- [ ] Session tao va cap nhat xuyen suot
- [ ] Evidence files hop le (validateEvidence pass)
- [ ] Cong kiem tra dat 3 dieu kien truoc khi sua
- [ ] Test pass sau khi sua
- [ ] User xac nhan thanh cong
</success_criteria>
